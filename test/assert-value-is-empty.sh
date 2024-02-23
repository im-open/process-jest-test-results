#!/bin/bash


name=''
value=''

for arg in "$@"; do
    case $arg in
    --name)
        name=$2
        shift # Remove argument --name from `$@`
        shift # Remove argument value from `$@`
        ;;
    --value)
        value=$2
        shift # Remove argument --expected from `$@`
        shift # Remove argument value from `$@`
        ;;
    esac
done

echo "
Asserting $name is empty
$name value: '$value'"

if [ -z "$value" ]
then
  echo "$name is empty which is expected."
else
  echo "$name is not empty which is not expected."
  exit 1
fi