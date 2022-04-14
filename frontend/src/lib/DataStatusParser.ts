import {dateToString} from '../lib/index'
import {Product} from '../../../backend/src/entity/Product'
import axios from 'axios'

export interface ReducedSearchResponse {
  measurementDate: string;
  productId: string;
  legacy: boolean;
  uuid: string;
  qualityScore?: number;
}

export interface ProductInfo {
  id: string;
  legacy: boolean;
  uuid: string;
  qualityScore?: number | null;
}

export interface ProductLevels {
  '1b': ProductInfo[];
  '1c': ProductInfo[];
  '2': ProductInfo[];
}

export interface ProductDate {
  date: string;
  products: ProductLevels;
}

export interface ProductYear {
  year: string;
  dates: ProductDate[];
}

export class DataStatusParser {
  constructor(searchPayload: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.searchPayload = searchPayload
  }

  private readonly searchPayload: any // eslint-disable-line @typescript-eslint/no-explicit-any
  private readonly apiUrl = process.env.VUE_APP_BACKENDURL
  private searchResponse: ReducedSearchResponse[] | null = null
  allProducts: Product[] | null = null
  years: ProductYear[] = []
  lvlTranslate: { [key: string]: keyof ProductLevels } = {}


  async engage() {
    const [searchRes, prodRes] = await Promise.all([
      axios.get(`${this.apiUrl}search/`, { params: this.searchPayload }),
      axios.get(`${this.apiUrl}products/`),
    ])
    this.searchResponse = searchRes.data
    this.allProducts = prodRes.data.filter((prod: Product) => !prod.experimental)
    if (!this.searchResponse || !this.allProducts || this.searchResponse.length == 0) return this

    this.lvlTranslate = this.allProducts.reduce((acc, cur) => ({...acc, [cur.id]: cur.level as keyof ProductLevels}), {})
    const initialDate = new Date(
      `${this.searchResponse[this.searchResponse.length - 1].measurementDate.toString().substr(0,4)}-01-01`)
    const endDate = new Date(this.searchResponse[0].measurementDate)
    const allDates: string[] = []
    while (initialDate <= endDate) {
      allDates.push(dateToString(new Date(initialDate)))
      initialDate.setDate(initialDate.getDate() + 1)
    }
    this.years = this.searchResponse
      .reduce((acc: ProductYear[], cur) => {
        const [year, month, day] = cur.measurementDate.toString().split('-')
        const date = `${month}-${day}`
        const productInfo = {
          id: cur.productId,
          legacy: cur.legacy,
          uuid: cur.uuid,
          qualityScore: 'qualityScore' in cur ? cur.qualityScore : undefined
        }
        const yearIndex = acc.findIndex(obj => obj.year == year)
        if (yearIndex == -1) {
          const newObj = {
            year,
            dates: allDates
              .filter(dateStr => dateStr.substr(0,4) == year)
              .map(dateStr => {
                const dateSubstr = dateStr.substr(5)
                return {
                  date: dateSubstr,
                  products: dateSubstr == date ? this.createProductLevels(productInfo) : this.createProductLevels()
                }
              })
          }
          return acc.concat([newObj])
        } else {
          const foundObj = acc[yearIndex]
          const dateIndex = foundObj.dates.findIndex(obj => obj.date == date)
          const existingProducts = acc[yearIndex].dates[dateIndex].products
          acc[yearIndex].dates[dateIndex].products = this.createProductLevels(productInfo, existingProducts)
          return acc
        }
      }, [])
    return this
  }

  private createProductLevels(productInfo?: ProductInfo, existingObj?: ProductLevels) {
    if (!existingObj) {
      existingObj = {
        '1b': [],
        '1c': [],
        '2': [],
      }
    }
    if (productInfo) {
      const {id, legacy, qualityScore, uuid} = productInfo
      existingObj[this.lvlTranslate[id]].push({
        id,
        legacy,
        qualityScore,
        uuid,
      })
    }
    return existingObj
  }


}
