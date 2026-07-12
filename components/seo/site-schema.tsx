import type { OrganizationSchema, WebSiteSchema } from "@/lib/seo/site-settings";

type Props = {
  organization: OrganizationSchema;
  website: WebSiteSchema;
};

export function SiteSchemaScripts({ organization, website }: Props) {
  const schemas = [organization, website];
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      type="application/ld+json"
    />
  );
}
