#!/bin/bash

name=''
expectedFileName=''
actualFileName=''

for arg in "$@"; do
    case $arg in
    --name)
        name=$2
        shift # Remove argument --name from `$@`
        shift # Remove argument value from `$@`
        ;;
    --expectedFileName)
        expectedFileName=$2
        shift # Remove argument --expected from `$@`
        shift # Remove argument value from `$@`
        ;;
    --actualFileName)
        actualFileName=$2
        shift # Remove argument --actual from `$@`
        shift # Remove argument value from `$@`
        ;;
    
    esac
done

echo "
Asserting file contents match:
Expected file name: '$expectedFileName'
Actual file name:   '$actualFileName'"

# First make sure the actual file exists
if [ -f "$actualFileName" ]
then
  echo "
$actualFileName exists which is expected."
  actualFileContents=$(cat $actualFileName)
else
  echo "
$actualFileName does not exist which is not expected"
  exit 1
fi
expectedFileContents=$(cat $expectedFileName)


# Then compare the contents
name="file contents"
echo "
Expected $name: '$expectedFileContents'
Actual $name:   '$actualFileContents'"

if [ "$expectedFileContents" != "$actualFileContents" ]; then
  echo "The expected $name does not match the actual $name."  
  exit 1
else 
  echo "The expected and actual $name values match."
fi