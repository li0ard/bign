import { bytesToNumberBE, bytesToNumberLE, concatBytes, equalBytes, hexToBytes, numberToBytesBE, numberToBytesLE, randomBytes } from "@noble/curves/utils";
import { BELTOID, SignMode, type BignCurveParameters, type SignOptions, type VerifyOptins } from "./const";
import { weierstrass } from "@noble/curves/abstract/weierstrass";
import { beltHash, encryptWBL } from "@li0ard/belt";

/**
 * Generate public key from private.
 * @param parameters Curve parameters
 * @param prv Private key
 * @returns {Uint8Array} Uncompressed public key in ANSI X9.62 format
 */
export const getPublicKey = (parameters: BignCurveParameters, prv: Uint8Array): Uint8Array => {
    let p = weierstrass(parameters).BASE.multiply(bytesToNumberLE(prv));

    return concatBytes(hexToBytes("04"), numberToBytesLE(p.x, parameters.length), numberToBytesLE(p.y, parameters.length))
}

/**
 * Generate deterministic one time key for private key and message digest
 * @param parameters Curve parameters
 * @param prv Private key
 * @param digest Message digest
 * @param oid Hash algorithm OID (Default - BelT Hash)
 * @param t Optional vector
 */
export const genK = (parameters: BignCurveParameters, prv: Uint8Array, digest: Uint8Array, oid: Uint8Array = BELTOID, t: Uint8Array = new Uint8Array()): Uint8Array => {
    const theta = beltHash(concatBytes(oid, prv, t));
    let kBytes: Uint8Array = new Uint8Array(digest);

    while (true) {
        kBytes = encryptWBL(theta, kBytes);
        
        const k = bytesToNumberBE(kBytes);
        if (k > 0n && k < parameters.n) return numberToBytesBE(k, parameters.length);
    }
}

/**
 * Generate signature of provided digest
 * @param parameters Curve parameters
 * @param prv Private key
 * @param digest Digest to sign
 * @param opts Parameters for signing
 */
export const sign = (parameters: BignCurveParameters, prv: Uint8Array, digest: Uint8Array, opts: SignOptions = {}): Uint8Array => {
    const curve = weierstrass(parameters);
    const Fn = curve.Fn;
    opts.oid ||= BELTOID;
    opts.mode ||= SignMode.DETERMINISTIC;
    opts.k ||= (opts.mode == SignMode.DETERMINISTIC ? genK(parameters, prv, digest, opts.oid) : randomBytes(parameters.length));
    const R = curve.BASE.multiply(bytesToNumberLE(opts.k)).x;

    const S0 = beltHash(concatBytes(opts.oid, numberToBytesLE(R, parameters.length), digest)).slice(0, parameters.length / 2);
    const S1 = numberToBytesLE(Fn.sub(
        Fn.sub(bytesToNumberLE(opts.k), bytesToNumberLE(digest)),
        Fn.mul(
            Fn.add(bytesToNumberLE(S0), (2n ** (BigInt(parameters.length / 2) * 8n))),
            bytesToNumberLE(prv)
        )
    ), parameters.length);

    return concatBytes(S0,S1);
}

/**
 * Verify signature of provided digest
 * @param parameters Curve parameters
 * @param pub Public key (Uncompressed ANSI X9.62 point)
 * @param digest Digest to verify
 * @param signature Signature
 * @param opts Parameters for verify (Hash algorithm OID)
 */
export const verify = (parameters: BignCurveParameters, pub: Uint8Array, digest: Uint8Array, signature: Uint8Array, opts: VerifyOptins = {}): boolean => {
    const curve = weierstrass(parameters);
    const Fn = curve.Fn;
    opts.oid ||= BELTOID;

    if(signature.length != 3 * (parameters.length / 2)) return false;
    const S0 = signature.slice(0, (parameters.length / 2));
    const S1 = signature.slice((parameters.length / 2));

    if(bytesToNumberLE(S1) >= parameters.n) return false;

    const Q = curve.fromAffine({
        x: bytesToNumberLE(pub.slice(1, parameters.length + 1)),
        y: bytesToNumberLE(pub.slice(parameters.length + 1))
    });
    Q.assertValidity();

    const R = curve.BASE
        .multiply(Fn.add(bytesToNumberLE(S1), bytesToNumberLE(digest)))
        .add(Q.multiply(Fn.add(bytesToNumberLE(S0), (2n ** (BigInt(parameters.length / 2) * 8n)))));
    
    if(R.is0()) return false;
    
    const t = beltHash(concatBytes(opts.oid, numberToBytesLE(R.x, parameters.length), digest)).slice(0, parameters.length / 2);
    if(equalBytes(S0, t)) return true;
    return false;
}

export * from "./const";