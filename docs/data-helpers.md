## Constants

<dl>
<dt><a href="#float48">float48</a> ⇒ <code>number</code></dt>
<dd><p>Convert the provided Uint8Array into a Turbo Pascal 48 bit float value.
May be faulty with large numbers due to float percision.</p>
<p>While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.</p>
<p>The Real48 type exists for backward compatibility with Turbo Pascal. It defines a 6-byte floating-point type.
The Real48 type has an 8-bit exponent and a 39-bit normalized mantissa. It cannot store denormalized values, infinity, or not-a-number. If the exponent is zero, the number is zero.</p>
<p>Structure (Bytes, Big Endian)
5: SMMMMMMM 4: MMMMMMMM 3: MMMMMMMM 2: MMMMMMMM 1: MMMMMMMM 0: EEEEEEEE</p>
<p>Structure (Bytes, Little Endian)
0: EEEEEEEE 1: MMMMMMMM 2: MMMMMMMM 3: MMMMMMMM 4: MMMMMMMM 5: SMMMMMMM</p>
<p>E[8]: Exponent
M[39]: Mantissa
S[1]: Sign</p>
<p>Value: (-1)^s * 2^(e - 129) * (1.f)</p>
</dd>
<dt><a href="#float80">float80</a> ⇒ <code>number</code></dt>
<dd><p>Convert the current buffer into an IEEE 80 bit extended float value.</p>
</dd>
</dl>

<a name="float48"></a>

## float48 ⇒ <code>number</code>
Convert the provided Uint8Array into a Turbo Pascal 48 bit float value.
May be faulty with large numbers due to float percision.

While most languages use a 32-bit or 64-bit floating point decimal variable, usually called single or double,
Turbo Pascal featured an uncommon 48-bit float called a real which served the same function as a float.

The Real48 type exists for backward compatibility with Turbo Pascal. It defines a 6-byte floating-point type.
The Real48 type has an 8-bit exponent and a 39-bit normalized mantissa. It cannot store denormalized values, infinity, or not-a-number. If the exponent is zero, the number is zero.

Structure (Bytes, Big Endian)
5: SMMMMMMM 4: MMMMMMMM 3: MMMMMMMM 2: MMMMMMMM 1: MMMMMMMM 0: EEEEEEEE

Structure (Bytes, Little Endian)
0: EEEEEEEE 1: MMMMMMMM 2: MMMMMMMM 3: MMMMMMMM 4: MMMMMMMM 5: SMMMMMMM

E[8]: Exponent
M[39]: Mantissa
S[1]: Sign

Value: (-1)^s * 2^(e - 129) * (1.f)

**Kind**: global constant  
**Returns**: <code>number</code> - The read value as a number.  
**See**: [Turbo Pascal Real](http://www.shikadi.net/moddingwiki/Turbo_Pascal_Real)  

| Param | Type | Description |
| --- | --- | --- |
| uint8 | <code>Uint8Array</code> | The data to process to a float48 value. |

<a name="float80"></a>

## float80 ⇒ <code>number</code>
Convert the current buffer into an IEEE 80 bit extended float value.

**Kind**: global constant  
**Returns**: <code>number</code> - The read value as a number.  
**See**: [Extended_Precision](https://en.wikipedia.org/wiki/Extended_precision)  

| Param | Type | Description |
| --- | --- | --- |
| uint8 | <code>Uint8Array</code> | The raw data to convert to a float80. |

