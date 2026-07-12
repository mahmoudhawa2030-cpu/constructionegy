import { jsonLdScriptContent } from "@/lib/seo/json-ld";

type Props = {
  data: unknown;
};

/** Renders a single application/ld+json script tag. */
export function JsonLd({ data }: Props) {
  if (data == null) return null;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(data) }}
      type="application/ld+json"
    />
  );
}
