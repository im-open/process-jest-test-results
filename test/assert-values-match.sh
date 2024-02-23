#!/bin/bash

name=''
expectedValue=''
actualValue=''

for arg in "$@"; do
    case $arg in
    --name)
        name=$2
        shift # Remove argument --name from `$@`
        shift # Remove argument value from `$@`
        ;;
    --expected)
        expectedValue=$2
        shift # Remove argument --expected from `$@`
        shift # Remove argument value from `$@`
        ;;
    --actual)
        actualValue=$2
        shift # Remove argument --actual from `$@`
        shift # Remove argument value from `$@`
        ;;
    
    esac
done

echo "
Asserting $name values match
Expected $name: '$expectedValue'
Actual $name:   '$actualValue'"

if [ "$expectedValue" != "$actualValue" ]; then
  echo "The expected $name does not match the actual $name."  
  exit 1
else 
  echo "The expected and actual $name values match."
fi