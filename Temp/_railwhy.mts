// why do the listing rails not render? replay the exact fetches
const id = "vis-ankara-cmpmtymm8pg";
const a = await fetch(`http://localhost:3031/api/listings/${id}`).then((r) => r.json());
const L = a.listing ?? a;
console.log("listing:", !!L, "vendorId:", L.vendorId, "slug:", L.categorySlug);
const ex = await fetch(`http://localhost:3031/api/explore`).then((r) => r.json());
const exData = ex.data ?? [];
console.log("bare explore n:", exData.length, "campus param default? first vendorIds:", exData.slice(0, 3).map((l: { vendorId: string }) => l.vendorId));
const fromVendor = exData.filter((l: { vendorId: string; id: string }) => l.vendorId === L.vendorId && l.id !== id);
console.log("same-vendor matches:", fromVendor.length, fromVendor.map((l: { id: string }) => l.id).slice(0, 4));
const ex2 = await fetch(`http://localhost:3031/api/explore?category=${L.categorySlug}`).then((r) => r.json());
console.log("category matches:", (ex2.data ?? []).filter((l: { vendorId: string; id: string }) => l.vendorId !== L.vendorId && l.id !== id).length);
