"use client";

/**
 * ShopifyConfigureButton — client island for the Shopify integration card.
 * Shows an alert prompting the user to enter their Shopify API key.
 */
export default function ShopifyConfigureButton() {
  function handleClick() {
    alert("Enter your Shopify API key to connect");
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
    >
      Configure
    </button>
  );
}
