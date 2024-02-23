#!/bin/bash

name=''
value1=''
value2=''

for arg in "$@"; do
    case $arg in
    --name)
        name=$2
        shift # Remove argument --name from `$@`
        shift # Remove argument value from `$@`
        ;;
    --value1)
        value1=$2
        shift # Remove argument --expected from `$@`
        shift # Remove argument value from `$@`
        ;;
    --value2)
        value2=$2
        shift # Remove argument --actual from `$@`
        shift # Remove argument value from `$@`
        ;;
    
    esac
done

echo "
Asserting $name values do not match
$name 1: '$value1'
$name 2: '$value2'"

if [ "$value1" != "$value2" ]; then
  echo "$name 1 does not match $name 2, which is expected."  
else 
  echo "Values 1 and 2 match, which is not expected."
  exit 1
fi