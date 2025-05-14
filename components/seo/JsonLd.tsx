'use client';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * JSON-LD構造化データをページに埋め込むコンポーネント
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
