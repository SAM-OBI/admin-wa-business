import fastJsonStableStringify from 'fast-json-stable-stringify';

/**
 * 🛡️ Vanguard Signing Utility (Admin v32.0)
 * 
 * Ports the deterministic canonicalization logic to the browser.
 * Uses SubtleCrypto for SHA-256 to ensure zero-dependency forensic stability.
 */
export class VanguardSigningUtil {
  
  /**
   * Computes a SHA-256 hash of the request body.
   */
  static async computeBodyHash(body: any): Promise<string> {
    if (!body || Object.keys(body).length === 0) {
      return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // SHA256 of empty string
    }
    const stableBody = fastJsonStableStringify(body);
    return this.sha256(stableBody);
  }

  /**
   * Alphabetically sorts query parameters for deterministic signing.
   */
  static canonicalizeQuery(query: Record<string, any>): string {
    const keys = Object.keys(query).sort();
    return keys
      .map(key => {
        const val = query[key];
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`;
      })
      .join('&');
  }

  /**
   * Generates the canonical string for signing.
   * Format: METHOD\nPATH\nQUERY\nBODY_HASH\nTIMESTAMP\nNONCE
   */
  static generateCanonicalString(data: {
    method: string;
    path: string;
    query: Record<string, any>;
    bodyHash: string;
    timestamp: string;
    nonce: string;
  }): string {
    const canonicalQuery = this.canonicalizeQuery(data.query);
    return [
      data.method.toUpperCase(),
      data.path,
      canonicalQuery,
      data.bodyHash,
      data.timestamp,
      data.nonce
    ].join('\n');
  }

  /**
   * Generates a signature from a canonical string.
   */
  static async generateSignature(canonicalString: string): Promise<string> {
      return this.sha256(canonicalString);
  }

  /**
   * Browser-compatible SHA-256 using SubtleCrypto
   */
  private static async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
