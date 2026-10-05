## Functions

<dl>
<dt><a href="#parsePNG">parsePNG()</a></dt>
<dd><p>Container validation is performed once; chunk payloads are views of the owned/borrowed source.</p>
</dd>
<dt><a href="#unfilterRow">unfilterRow()</a></dt>
<dd><p>Reconstruct an owned row in place. Previous-row storage is reset at each Adam7 pass.</p>
</dd>
<dt><a href="#decodeSamples">decodeSamples()</a></dt>
<dd><p>One element per sample; packed indexes stay indexes, and 16-bit precision is retained.</p>
</dd>
<dt><a href="#writeRGBA">writeRGBA()</a></dt>
<dd><p>Writes straight RGBA8 without premultiplication, color management, or loss of hidden RGB.</p>
</dd>
<dt><a href="#encodeRows">encodeRows()</a></dt>
<dd><p>None is the deterministic low-CPU default; adaptive is explicitly opt-in.</p>
</dd>
<dt><a href="#rewriteIndexedModel">rewriteIndexedModel()</a></dt>
<dd><p>Source has already been parsed and decoded. A caller must not supply a mutated model.</p>
</dd>
</dl>

<a name="parsePNG"></a>

## parsePNG()
Container validation is performed once; chunk payloads are views of the owned/borrowed source.

**Kind**: global function  
<a name="unfilterRow"></a>

## unfilterRow()
Reconstruct an owned row in place. Previous-row storage is reset at each Adam7 pass.

**Kind**: global function  
<a name="decodeSamples"></a>

## decodeSamples()
One element per sample; packed indexes stay indexes, and 16-bit precision is retained.

**Kind**: global function  
<a name="writeRGBA"></a>

## writeRGBA()
Writes straight RGBA8 without premultiplication, color management, or loss of hidden RGB.

**Kind**: global function  
<a name="encodeRows"></a>

## encodeRows()
None is the deterministic low-CPU default; adaptive is explicitly opt-in.

**Kind**: global function  
<a name="rewriteIndexedModel"></a>

## rewriteIndexedModel()
Source has already been parsed and decoded. A caller must not supply a mutated model.

**Kind**: global function  
