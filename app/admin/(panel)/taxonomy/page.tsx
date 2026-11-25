import { taxonomyWithCounts } from "@/lib/admin/repo";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const metadata = { title: "Breeds & filters" };

export default function TaxonomyPage() {
  return (
    <>
      <div className="adm-head"><div><h1>Breeds & filters</h1><p>These drive the filter chips on /puppies (where, breed). The slug is used in the filter URL, e.g. /puppies?breed=maltipoo.</p></div></div>
      <div className="adm-grid adm-grid-3" style={{ alignItems: "start" }}>
        <TaxonomyManager table="breeds" title="Breeds" rows={taxonomyWithCounts("breeds")} />
        <TaxonomyManager table="origins" title="Where (origins)" rows={taxonomyWithCounts("origins")} hint="“local” shows as the In Dubai chip; keep the slugs local / imported." />
        <TaxonomyManager table="collections" title="Collections" rows={taxonomyWithCounts("collections")} hint="Shown next to the where chips, e.g. Korean Teacup." />
      </div>
    </>
  );
}
