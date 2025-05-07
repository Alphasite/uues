# USCIS Enhancement Suite (UES)

## Rebuilding event codes

```shell
 cat ./data/screening.xsd \
  | xq '[
      ."xs:schema" 
      | ."xs:simpleType"[] 
      | select(."@name" == "BenefitDocumentStatusCategoryCodeSimpleType") 
      | ."xs:restriction"."xs:enumeration"[] 
      | (."xs:annotation"."xs:documentation") 
      | capture("(?<key>\\w+) (?<value>.*)"; "")
    ] | from_entries'