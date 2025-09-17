<p align="center">
    <b>@li0ard/bign</b><br>
    <b>Bign (STB 34.101.45) curves and DSA in pure TypeScript</b>
    <br>
    <a href="https://li0ard.is-cool.dev/bign">docs</a>
    <br><br>
    <a href="https://github.com/li0ard/bign/actions/workflows/test.yml"><img src="https://github.com/li0ard/bign/actions/workflows/test.yml/badge.svg" /></a>
    <a href="https://github.com/li0ard/bign/blob/main/LICENSE"><img src="https://img.shields.io/github/license/li0ard/bign" /></a>
    <br>
    <a href="https://npmjs.com/package/@li0ard/bign"><img src="https://img.shields.io/npm/v/@li0ard/bign" /></a>
    <a href="https://jsr.io/@li0ard/bign"><img src="https://jsr.io/badges/@li0ard/bign" /></a>
    <br>
    <hr>
</p>

## Installation

```bash
# from NPM
npm i @li0ard/bign

# from JSR
bunx jsr i @li0ard/bign
```

## Supported modes:
- [x] DSA (standard curves included)

## Features
- Provides simple and modern API
- Most of the APIs are strictly typed
- Fully complies with [STB 34.101.45 (in Russian)](https://apmi.bsu.by/assets/files/std/bign-spec295.pdf) standard
- Supports Bun, Node.js, Deno, Browsers

## Examples
### Create signature (Deterministic)

```ts
import { BIGN128, sign, verify, getPublicKey } from "@li0ard/bign";

let curve = BIGN128;
let privKey = hexToBytes("1F66B5B84B7339674533F0329C74F21834281FED0732429E0C79235FC273E269");
let publicKey = getPublicKey(curve, privKey);
let digest = hexToBytes("ABEF9725D4C5A83597A367D14494CC2542F20F659DDFECC961A3EC550CBA8C75");

let signature = sign(curve, privKey, digest);
console.log(signature); // -> Uint8Array [...]
console.log(verify(curve, publicKey, digest, signature)); // -> true
```

### Create signature (Default)

```ts
import { SignMode, BIGN128, sign, verify, getPublicKey } from "@li0ard/bign";

let curve = BIGN128;
let privKey = hexToBytes("1F66B5B84B7339674533F0329C74F21834281FED0732429E0C79235FC273E269");
let publicKey = getPublicKey(curve, privKey);
let digest = hexToBytes("ABEF9725D4C5A83597A367D14494CC2542F20F659DDFECC961A3EC550CBA8C75");

let signature = sign(curve, privKey, digest, { mode: SignMode.DEFAULT });
console.log(signature); // -> Uint8Array [...]
console.log(verify(curve, publicKey, digest, signature)); // -> true
```