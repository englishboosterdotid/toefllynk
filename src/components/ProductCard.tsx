type ProductCardProps = {
  id: string;
  title: string;
  description: string;
  price: number;
  promoPrice?: number | null;
  thumbnail?: string | null;
  affiliateEnabled?: boolean;
  isArchived?: boolean;
  isVisibleOnMicrosite?: boolean;
  isFeatured?: boolean;
  packageType?: string | null;
  examCredits?: number;
  certificateIncluded?: boolean;
  reviewIncluded?: boolean;
  zoomIncluded?: boolean;
};

export default function ProductCard({
  id,
  title,
  description,
  price,
  promoPrice,
  thumbnail,
  affiliateEnabled = false,
  isArchived = false,
  isVisibleOnMicrosite = true,
  isFeatured = false,
  packageType,
  examCredits,
  certificateIncluded,
  reviewIncluded,
  zoomIncluded,
}: ProductCardProps) {
  let status = "ACTIVE SELLING";

  if (!affiliateEnabled && !isArchived) {
    status = "AFFILIATE CLOSED";
  }

  if (isArchived) {
    status = "PROGRAM CLOSED";
  }

  const isBundle = packageType === "BUNDLE";

  return (
    <div className={`bg-white rounded-3xl shadow p-5 ${isVisibleOnMicrosite ? "ring-2 ring-green-400" : ""} ${isArchived ? "opacity-75" : ""}`}>
      {thumbnail && (
        <img src={thumbnail} className="w-full h-44 object-cover rounded-2xl mb-4" />
      )}

      {isArchived && (
        <div className="absolute inset-0 bg-slate-900/10 rounded-2xl pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-xs font-semibold ${isArchived ? "text-slate-400" : "text-blue-500"}`}>
              {isBundle ? "BUNDLE PACKAGE" : packageType || "INDIVIDUAL PACKAGE"}
            </p>
            {isFeatured && (
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                ★ Featured
              </span>
            )}
          </div>
          <h3 className={`text-xl font-bold ${isArchived ? "text-slate-400" : ""}`}>{title}</h3>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-3 py-1 rounded-full ${isArchived ? "bg-slate-200 text-slate-600" : "bg-gray-100"}`}>
            {status}
          </span>
          {isVisibleOnMicrosite && !isArchived && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              Visible
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">{description}</p>
      <p className="mt-3 font-semibold text-lg">Rp {promoPrice || price}</p>

      {!isBundle ? (
        <div className="mt-4 space-y-1 text-sm text-gray-600">
          <p>• {examCredits} TOEFL Simulation Credits</p>
          {certificateIncluded && <p>• Score Prediction Certificate</p>}
          {reviewIncluded && <p>• Answer Review Included</p>}
          {zoomIncluded && <p>• Zoom Mentoring Included</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-1 text-sm text-gray-600">
          <p>• Manual Seller Fulfillment</p>
          <p>• Buyer Contact Delivered After Payment</p>
          <p>• Suitable for Mentoring / Consultation</p>
        </div>
      )}

      <div className="mt-5 flex gap-3 flex-wrap">
        <form action="/api/products/toggle-affiliate" method="POST">
          <input type="hidden" name="productId" value={id} />
          <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm">
            {affiliateEnabled ? "Close Affiliate" : "Open Affiliate"}
          </button>
        </form>

        <form action="/api/products/toggle-visibility" method="POST">
          <input type="hidden" name="productId" value={id} />
          <input type="hidden" name="visible" value={isVisibleOnMicrosite ? "false" : "true"} />
          <button className={`${isVisibleOnMicrosite ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"} px-4 py-2 rounded-full text-sm`}>
            {isVisibleOnMicrosite ? "Hide from Microsite" : "Show on Microsite"}
          </button>
        </form>

        <form action="/api/products/archive" method="POST">
          <input type="hidden" name="productId" value={id} />
          <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isArchived
              ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
              : "bg-red-50 text-red-500 hover:bg-red-100"
          }`}>
            {isArchived ? "🔄 Reopen Program" : "Close Program"}
          </button>
        </form>

        <form action="/api/products/featured" method="POST">
          <input type="hidden" name="productId" value={id} />
          <input type="hidden" name="featured" value={isFeatured ? "false" : "true"} />
          <button className={`${isFeatured ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"} px-4 py-2 rounded-full text-sm`}>
            {isFeatured ? "Remove Featured" : "Set Featured"}
          </button>
        </form>
      </div>
    </div>
  );
}