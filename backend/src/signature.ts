import { createHash, createSign } from 'node:crypto';

export interface SignedFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  // WebID of the user on behalf of whom the application acts (it must have registered the application)
  onBehalfOf?: string;
}

/**
 * HTTP signature (draft-cavage), as verified by SemApps
 */
export const signedFetch = async (
  url: string,
  { method = 'GET', headers = {}, body, onBehalfOf }: SignedFetchOptions,
  { keyId, privateKeyPem }: { keyId: string; privateKeyPem: string }
) => {
  const { host, pathname, search } = new URL(url);
  const signedHeaders: Record<string, string> = { host, date: new Date().toUTCString() };
  if (body) signedHeaders.digest = `SHA-256=${createHash('sha256').update(body).digest('base64')}`;
  // Must be signed, otherwise the Pod provider rejects it
  if (onBehalfOf) signedHeaders['on-behalf-of'] = onBehalfOf;

  const signatureString = [
    `(request-target): ${method.toLowerCase()} ${pathname}${search}`,
    ...Object.entries(signedHeaders).map(([name, value]) => `${name}: ${value}`)
  ].join('\n');
  const signature = createSign('sha256').update(signatureString).sign(privateKeyPem, 'base64');

  const { host: _, ...otherSignedHeaders } = signedHeaders;
  return fetch(url, {
    method,
    body,
    headers: {
      ...headers,
      ...otherSignedHeaders,
      signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) ${Object.keys(signedHeaders).join(' ')}",signature="${signature}"`
    }
  });
};
