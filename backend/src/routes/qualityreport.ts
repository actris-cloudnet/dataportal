import { Connection, Repository } from "typeorm";
import { ErrorLevel, QualityReport } from "../entity/QualityReport";
import { Request, RequestHandler, Response } from "express";
import { FileRoutes } from "./file";
import { FileQuality } from "../entity/FileQuality";
import { ModelFile, RegularFile } from "../entity/File";
import { SearchFile } from "../entity/SearchFile";
import { TestInfo } from "../entity/TestInfo";

interface Report {
  qcVersion: string;
  timestamp: Date;
  tests: Test[];
}

interface Test {
  testId: string;
  exceptions: Exception[];
}

interface Exception {
  result: ErrorLevel;
}

interface TestSummary {
  testId: string;
  maxErrorLevel: ErrorLevel;
  numberOfErrors: number;
  numberOfWarnings: number;
}

interface QualityReportWithTestInfo extends QualityReport {
  testInfo?: TestInfo;
}

interface FileQualityWithTestInfo extends FileQuality {
  testReports: QualityReportWithTestInfo[];
}

export class QualityReportRoutes {
  constructor(conn: Connection, fileRoutes: FileRoutes) {
    this.conn = conn;
    this.qualityReportRepo = conn.getRepository<QualityReport>("quality_report");
    this.fileQualityRepo = conn.getRepository<FileQuality>("file_quality");
    this.fileRoutes = fileRoutes;
    this.fileRepo = conn.getRepository<RegularFile>("regular_file");
    this.modelFileRepo = conn.getRepository<ModelFile>("model_file");
    this.searchFileRepo = conn.getRepository<SearchFile>("search_file");
  }

  readonly conn: Connection;
  readonly qualityReportRepo: Repository<QualityReport>;
  readonly fileQualityRepo: Repository<FileQuality>;
  readonly fileRoutes: FileRoutes;
  readonly fileRepo: Repository<RegularFile>;
  readonly modelFileRepo: Repository<ModelFile>;
  readonly searchFileRepo: Repository<SearchFile>;

  qualityReport: RequestHandler = async (req: Request, res: Response, next) => {
    const qualityReport = await this.conn
      .getRepository<FileQualityWithTestInfo>("file_quality")
      .createQueryBuilder("fileQuality")
      .leftJoinAndSelect("fileQuality.testReports", "testReport")
      .leftJoinAndMapOne("testReport.testInfo", TestInfo, "testInfo", "testReport.testId = testInfo.testId")
      .where("uuid = :uuid", { uuid: req.params.uuid })
      .addOrderBy(
        `CASE WHEN testReport.result = '${ErrorLevel.ERROR}'   THEN 1
              WHEN testReport.result = '${ErrorLevel.WARNING}' THEN 2
              WHEN testReport.result = '${ErrorLevel.PASS}'    THEN 3
              ELSE 4
         END`
      )
      .addOrderBy("COALESCE(testInfo.name, testReport.testId)")
      .getOne();
    if (!qualityReport) {
      return next({ status: 404, errors: ["No files match this UUID"] });
    }
    res.send({
      ...qualityReport,
      testReports: qualityReport.testReports.map((test) => ({
        testId: test.testId,
        name: test.testInfo ? test.testInfo.name : test.testId,
        description: test.testInfo && test.testInfo.description,
        result: test.result,
        exceptions: test.exceptions,
      })),
    });
  };

  putQualityReport: RequestHandler = async (req: Request, res: Response, next) => {
    const uuid = req.params.uuid;
    const fullReport: Report = req.body;
    try {
      const existingFile = await this.fileRoutes.findAnyFile((repo, _) =>
        repo.findOne(uuid, { relations: ["product"] })
      );
      if (existingFile === undefined) {
        return next({ status: 400, errors: ["No files match this UUID"] });
      }
      await this.fileQualityRepo.delete(uuid);
      const testOutlines = this.parseTests(fullReport);
      const nErrors = this.countTestResults(testOutlines, ErrorLevel.ERROR);
      const nWarnings = this.countTestResults(testOutlines, ErrorLevel.WARNING);
      const maxErrorLevel = this.getMaxErrorLevel(nErrors, nWarnings);
      const fileQuality = await this.fileQualityRepo.save({
        uuid: uuid,
        errorLevel: maxErrorLevel,
        qcVersion: fullReport.qcVersion,
        tests: testOutlines.length,
        warnings: nWarnings,
        errors: nErrors,
        timestamp: fullReport.timestamp,
      });
      for (const test of fullReport.tests) {
        await this.qualityReportRepo.save({
          result: testOutlines.find((ele) => ele.testId === test.testId)!.maxErrorLevel,
          testId: test.testId,
          exceptions: test.exceptions,
          quality: fileQuality,
        });
      }
      const repo = this.getRepoForFile(existingFile);
      await repo.update(uuid, { errorLevel: maxErrorLevel });
      const existingSearchFile = this.searchFileRepo.findOne(uuid);
      if (existingSearchFile !== undefined) {
        await this.searchFileRepo.update(uuid, { errorLevel: maxErrorLevel });
      }
      res.sendStatus(201);
    } catch (e) {
      return next({ status: 500, errors: e });
    }
  };

  private parseTests(fileReport: Report): TestSummary[] {
    let results = [];
    for (const test of fileReport.tests) {
      let nErrors = 0;
      let nWarnings = 0;
      for (const report of test.exceptions) {
        if (report.result == ErrorLevel.ERROR) {
          nErrors += 1;
        } else if (report.result == ErrorLevel.WARNING) {
          nWarnings += 1;
        }
      }
      results.push({
        testId: test.testId,
        maxErrorLevel: this.getMaxErrorLevel(nErrors, nWarnings),
        numberOfErrors: nErrors,
        numberOfWarnings: nWarnings,
      });
    }
    return results;
  }

  private getMaxErrorLevel(nErrors: number, nWarnings: number): ErrorLevel {
    if (nErrors > 0) {
      return ErrorLevel.ERROR;
    }
    if (nWarnings > 0) {
      return ErrorLevel.WARNING;
    }
    return ErrorLevel.PASS;
  }

  private getRepoForFile(file: RegularFile | ModelFile) {
    if (file.product.id == "model") return this.modelFileRepo;
    return this.fileRepo;
  }

  private countTestResults = (results: TestSummary[], level: ErrorLevel) =>
    results.filter((obj) => obj.maxErrorLevel === level).length;
}
