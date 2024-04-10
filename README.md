# CSS Variables

A Figma plugin for importing and exporting variables between CSS and Figma.

### Import
- Variables can be imported into Figma either as a new collection or existing collection can be updated.
- Almost all the CSS color units are supported.
- Only px, in, cm, mm, pt, pc and rem length units are supported. And for the rem unit, the default font size 16px is used for conversion.
- The variables other than color and length units are silently ignored.


### Export
- Multiple modes can be exported at once from Figma.
- The color units can be exported in one of the following spaces, sRGB(hex, rgb, hsl, hwb), CIELAB(lab, lch), Oklab, oklch, display-p3. 
- Number units can be exported either as pixel(px) or rem.
- Also there's an option to preserve the alias.