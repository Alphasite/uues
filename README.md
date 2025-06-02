# Unofficial myUSCIS Enhancement Suite (UUES)

This displays the additional data the USCIS has already sent to your browser,
but doesn't currently display in the UI. This just a nice visualisation of the
data that USCIS is already sending you.

![image](https://github.com/user-attachments/assets/9450b44f-5f20-437b-a971-4d5ca2216cd5)

It is read only and will not send your data anywhere. If you dont trust me can
audit the code to ensure it doesn't do anything untoward.

Any contributions and enhancements are welcome! I am a backend developer
masquerading as the world's most mediocre frontend developer, so improvements
are welcome.

## *Disclaimer*

Usage of this software includes no warranty and this is provided as-is for
educational purposes. We do not provide or offer support, nor do we endorse its
usage. It is provided purely so people can build their own extensions for their
personal usage specifically to visualise the personal data sent by uscis to
users. It is not intended to allow you to file or gain any immigration benefits.

## Local Testing

First build the front end with `pnpm start` then once thats done load it into
your browser.

Open this page in firefox `about:debugging#/runtime/this-firefox` (other
browsers are similar) and hit `Load Temporary Add-on…` and then select the
manifest.json.

NOTE: if you make a change, you need to hit `reload` in the about page to see
you changes.

## Rebuilding event codes

We have a hard coded list of event types, generated from the public NEM 5
documents, its used to map internal codes to human-readable descriptions. If
they ever realise an updated doc, you can regenerate it as below.

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
