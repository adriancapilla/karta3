# Fixture técnica Unicode 17.0

`GraphemeBreakTest.txt` es la copia sin modificar del [corpus oficial Unicode 17.0](https://www.unicode.org/Public/17.0.0/ucd/auxiliary/GraphemeBreakTest.txt), descargado el 14/10/2026: 766 secuencias, SHA-256 `e2d134d2c52919bace503ebb6a551c1855fe1a1faec18478c78fff254a1793ec`.

Se usa exclusivamente en pruebas para contrastar todas las fronteras esperadas con `Intl.Segmenter('es', { granularity: 'grapheme' })`. No es un parser ni una dependencia externa en ejecución. No se instala en barajas ni acredita legibilidad o aprobación editorial.

Se conserva la licencia publicada en [Unicode](https://www.unicode.org/license.txt) como `LICENSE.txt`, SHA-256 `e7a93b009565cfce55919a381437ac4db883e9da2126fa28b91d12732bc53d96`. El copyright y las referencias originales permanecen en el corpus.
