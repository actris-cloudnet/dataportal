#!/bin/bash
#set -xv

PATH=${PATH}:/usr/local/bin:/bin:/usr/bin
#export ENV=${HOME}/.kshrc

# Usage:
#   cloudnet_transfer_often.sh --date YYYYMMDD --site sitename
# 
# If default site set:
#   cloudnet_transfer_often.sh --date YYYYMMDD 
#
# Data from yesterday
#   cloudnet_transfer_often.sh --site sitename

# Defaults go here
SITE=

# Initialise as empty
DATE=
YYYYMMDD=


function upload2cloudnet {
    FILENAME=$1
    INSTRUMENT=$2
    THEDATE=$3
    USERNAME=$4
    PASSWORD=$5
    # Note that username is sitename

    # Create file hash
    HASH=$(sha256sum $FILENAME | cut -f 1 -d " ")

    if [ "$HASH" -a "$INSTRUMENT" -a "$THEDATE"  ]
    then

    curl -v -X POST -u $USERNAME:$PASSWORD -H "Transfer-Encoding: chunked" \
      -F hashSum=$HASH \
      -F measurementDate=$THEDATE \
      -F instrument=$INSTRUMENT \
      -F file=@$FILENAME \
      https://cloudnet.fmi.fi/data-upload/


    fi
}

# Parse command-line arguments
while [ $# -gt 0 ]; do
    if [ $1 = "--date" ]; then
        if [ $# -lt 2 ]; then
            echo "No date given"
            exit 1
        fi
        DATE=$2
        shift
        shift
    elif [ $1 = "--site" ]; then
        if [ $# -lt 2 ]; then
            echo "No site given"
            exit 1
        fi
        SITE=$2
        shift
        shift
    else
        echo "Error: \"$1\" not understood"
        exit 1
    fi
done

if [ ! "$DATE" ] ; then
    # Default option is to get yesterdays data 
    YYYYMMDD=$(date --utc "+%Y%m%d" -d "today-1day")

    # Use this to change the default to get the day before yesterdays data
    #YYYYMMDD=$(date --utc "+%Y%m%d" -d "today-2day")

else
    # Check that date is YYYYMMDD (very rudimentary!)
    if [ $(echo "$DATE" | tr -d " "| wc -L) -eq 8 ] ; then
        YYYYMMDD=$DATE
    else
        echo "Error: DATE \"$DATE\" not understood"
        exit 1
    fi
fi

# Create the various date stems used in directories and filenames
YYYYMM=$(echo $YYYYMMDD |cut -c1-6)
YYYY=$(echo $YYYYMMDD |cut -c1-4)
MM=$(echo $YYYYMMDD |cut -c5-6)
DD=$(echo $YYYYMMDD |cut -c7-8)
THEDATE="${YYYY}-${MM}-${DD}"

# ceilometer has date stem with only one digit for year
YMMDD=$(echo $YYYYMMDD |cut -c4-8)
YYMM=$(echo $YYYYMMDD |cut -c3-6)


# RPG data has month and date dirs
MM=$(echo $YYYYMMDD |cut -c5-6)
DD=$(echo $YYYYMMDD |cut -c7-8)


##-- Copy files to cloudnet server  --##
#
# Find files for requested day and site.
# First set defaults for site, including:
# instrument names, directory locations, upload credentials
#
# Known instrument names are:
# radar:       rpg-fmcw-94, mira
# lidar:       cl51, cl31, ct25k, chm15k
# mwr:         hatpro
# disdrometer: parsivel

case $SITE in
  bucharest)

    INSTRUMENTS="rpg-fmcw-94 chm15k hatpro"

    LOCALLIDARDIR=/data/frm4radar/inoe_folder/Ceilometer_DATA
    LOCALRADARDIR=/data/frm4radar/inoe_folder/radar_DATA
    LOCALMWRDIR=
    LOCALDISDIR=

    PASSWORD=

    ;;

  norunda)
    INSTRUMENTS="rpg-fmcw-94 cl51 "

    LOCALLIDARDIR=/data/frm4radar/smhi_folder/Ceilometer_DATA
    LOCALRADARDIR=/data/frm4radar/smhi_folder/Radar_DATA
    LOCALMWRDIR=/
    LOCALDISDIR=/data/frm4radar/smhi_folder/Disdrometer_DATA/netcdf

    PASSWORD=
    ;;

   example-site)
    INSTRUMENTS="rpg-fmcw-94 cl51 hatpro"

    LOCALLIDARDIR=
    LOCALRADARDIR=
    LOCALMWRDIR=/
    LOCALDISDIR=

    PASSWORD=
    ;;

esac


# Find files for specific day
# Modify these according to your directory structure and filename convention
for INSTRUMENT in $INSTRUMENTS; do
  case $INSTRUMENT in
    rpg-fmcw-94)
      if [ -d ${LOCALRADARDIR}/${YYYY}/${MM}/${DD} ]; then
        cd ${LOCALRADARDIR}/${YYYY}/${MM}/${DD}
        FILENAMES=$(ls *.LV?)
      fi
      ;;

    cl51)
      if [ -d ${LOCALLIDARDIR}/${YYYY} ]; then
        cd ${LOCALLIDARDIR}/${YYYY}
        FILENAMES=$(ls A${YMMDD}*.DAT)
      fi
      ;;

    hatpro)
      if [ -d ${LOCALMWRDIR}/${YYYY}/${MM}/${DD} ]; then
        cd ${LOCALMWRDIR}/${YYYY}/${MM}/${DD}
        FILENAMES=$(ls * )
      fi
      ;;

    disdrometer)
      if [ -d ${LOCALDISDIR}/${YYMM} ]; then
        cd ${LOCALDISDIR}/${YYMM}
        FILENAMES=$(ls *.DAT)
      fi
      ;;

# Add new instrument block here as required


  esac


  for FILENAME in $FILENAMES; do
    if [ -f ${FILENAME} ]; then
      upload2cloudnet $FILENAME $INSTRUMENT $THEDATE $SITE $PASSWORD
    fi
  done
done

