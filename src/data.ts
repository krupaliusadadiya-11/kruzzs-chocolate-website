export type Product = {
  id: string;
  name: string;
  short: string;
  note: string;
  size: string;
  price: number;
  img: string;
  tone: "pistachio" | "dark" | "cream" | "butter" | "blush" | "cocoa";
  tag?: string;
};

/** Fictional demo products — illustrative prices in INR. */
export const PRODUCTS: Product[] = [
  { id: "pistachio-crunch", name: "Pistachio Crunch", short: "Milk chocolate loaded with roasted pistachio crunch.", note: "Nutty · Crunchy · Main-character energy", size: "100 g bar", price: 449, img: "p-pistachio", tone: "pistachio", tag: "Fan fave" },
  { id: "midnight-dark", name: "Midnight Dark", short: "70% dark chocolate. Deep, moody and a little dramatic.", note: "Intense · Velvety · After-hours", size: "100 g bar", price: 399, img: "p-midnight", tone: "dark" },
  { id: "milky-mood", name: "Milky Mood", short: "Creamy milk chocolate for soft-launch days.", note: "Creamy · Comforting · Classic", size: "100 g bar", price: 349, img: "p-milky", tone: "cream" },
  { id: "hazelnut-heaven", name: "Hazelnut Heaven", short: "Whole roasted hazelnuts in silky milk chocolate.", note: "Toasty · Whole nuts · Loud crunch", size: "100 g bar", price: 449, img: "p-hazelnut", tone: "butter" },
  { id: "caramel-crush", name: "Caramel Crush", short: "A caramel-inspired centre in a snap-happy shell.", note: "Buttery · Gooey · Slightly extra", size: "100 g bar", price: 429, img: "p-caramel", tone: "butter" },
  { id: "choco-bites", name: "Choco Bites", short: "Bite-size squares and mini truffles. Pocket-sized chaos.", note: "Snackable · Mixed · Dangerous", size: "150 g pouch", price: 299, img: "p-bites", tone: "blush", tag: "New" },
  { id: "brownie-bombs", name: "Brownie Bombs", short: "Fudgy brownie bites with a raspberry pop.", note: "Fudgy · Fruity · Gooey middle", size: "Box of 6", price: 549, img: "p-brownie", tone: "blush" },
  { id: "signature-truffles", name: "Signature Truffles", short: "Hand-rolled, cocoa-dusted, completely unshareable.", note: "Assorted · Giftable · Iconic", size: "Box of 12", price: 999, img: "p-truffles", tone: "cocoa", tag: "Gift-ready" },
];

export const BESTSELLERS = ["midnight-dark", "pistachio-crunch", "hazelnut-heaven", "signature-truffles"];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!;

export const INGREDIENTS = [
  { name: "Cocoa beans", img: "i-cocoa", line: "Roasted for deep, toasty cocoa notes." },
  { name: "Cocoa butter", img: "i-butter", line: "The reason it melts the way it does." },
  { name: "Milk", img: "i-milk", line: "For the creamy, comforting ones." },
  { name: "Hazelnuts", img: "i-hazel", line: "Roasted whole. Crunch included." },
  { name: "Vanilla", img: "i-vanilla", line: "A soft, warm finish in the background." },
  { name: "Caramel", img: "i-caramel", line: "Golden, buttery, slightly extra." },
];

export const GIFTS = [
  { name: "Birthday drops", img: "g-heart", line: "Sweeter than the cake. Probably.", product: "choco-bites" },
  { name: "Anniversary boxes", img: "g-red", line: "Say it with something unshareable.", product: "signature-truffles" },
  { name: "Celebration boxes", img: "s-hearts", line: "Big wins, small wins, Tuesday wins.", product: "brownie-bombs" },
  { name: "Premium assorted", img: "g-box", line: "The full KRUZZ'S line-up, one lid.", product: "signature-truffles" },
];

/** Placeholder demonstration content — not real customer reviews. */
export const TESTIMONIALS = [
  { quote: "Bought the Pistachio Crunch to share with my flatmates. Did not share with my flatmates.", who: "Sample reviewer A", tag: "Pistachio Crunch" },
  { quote: "The box is so pretty I kept it on my desk after the truffles were long gone.", who: "Sample reviewer B", tag: "Signature Truffles" },
  { quote: "Midnight Dark is my 2 a.m. personality. Rich, moody, zero regrets.", who: "Sample reviewer C", tag: "Midnight Dark" },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
