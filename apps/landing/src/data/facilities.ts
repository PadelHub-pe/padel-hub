/**
 * Facility directory data for the player-facing landing page.
 *
 * Source: padel_lima_research.json (PR #1, origin/chore/add-website)
 * 13 Lima padel facilities — all with WhatsApp contact.
 */

export interface DirectoryFacility {
  id: string;
  name: string;
  district: string;
  address: string;
  courtCount: number | null;
  courtType: "indoor" | "outdoor" | "mixto";
  phone: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  googleMapsUrl: string;
  imageUrl: string | null;
  amenities: string[];
  hours: string | null;
  /** Slug on bookings.padelhub.pe — null if not onboarded on PadelHub */
  bookingSlug: string | null;
}

/** Clean a raw phone string to digits-only for wa.me links */
function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

/** Build a Google Maps search URL from coordinates */
function toGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export const facilities: DirectoryFacility[] = [
  {
    id: "one-padel-olguin",
    name: "One Padel - Manuel Olguín",
    district: "Santiago de Surco",
    address: "Av. Manuel Olguín 245, Santiago de Surco 15023",
    courtCount: 4,
    courtType: "outdoor",
    phone: "+51 959 881 552",
    whatsappUrl: toWhatsAppUrl("+51 959 881 552"),
    instagramUrl: "https://www.instagram.com/onepadelperu/",
    googleMapsUrl: toGoogleMapsUrl(-12.086118, -76.973061),
    imageUrl:
      "https://onepadel-pe.matchpoint.com.es/Pages/images.ashx?id=52a704164143551e39465cf218eb1dbb",
    amenities: ["Estacionamiento", "Camerinos", "Cafeteria"],
    hours: "Lun-Dom 6:00-22:30",
    bookingSlug: null,
  },
  {
    id: "one-padel-orue",
    name: "One Padel - Domingo Orué",
    district: "Surquillo",
    address:
      "Pje. Recabarraca s/n, Altura cdra. 3 Av. Domingo Orué, Surquillo 15047",
    courtCount: 5,
    courtType: "outdoor",
    phone: "+51 916 994 252",
    whatsappUrl: toWhatsAppUrl("+51 916 994 252"),
    instagramUrl: "https://www.instagram.com/onepadelperu/",
    googleMapsUrl: toGoogleMapsUrl(-12.107056, -77.023392),
    imageUrl:
      "https://onepadel-pe.matchpoint.com.es/Pages/images.ashx?id=e8bd3c80a9a0641fd2b1c632064c0bf4",
    amenities: ["Estacionamiento"],
    hours: "Lun-Dom 6:00-00:00",
    bookingSlug: null,
  },
  {
    id: "one-padel-centro-naval",
    name: "One Padel - Centro Naval",
    district: "San Borja",
    address: "Av. San Luis 2347, San Borja 15037 (Centro Naval)",
    courtCount: 3,
    courtType: "outdoor",
    phone: "+51 980 003 317",
    whatsappUrl: toWhatsAppUrl("+51 980 003 317"),
    instagramUrl: "https://www.instagram.com/onepadelperu/",
    googleMapsUrl: toGoogleMapsUrl(-12.0964674, -76.9952983),
    imageUrl:
      "https://onepadel-pe.matchpoint.com.es/Pages/images.ashx?id=5c4a2ff9f4369fa02d5f2bc441d230b6",
    amenities: ["Estacionamiento", "Camerinos"],
    hours: null,
    bookingSlug: null,
  },
  {
    id: "one-padel-trigal",
    name: "One Padel - Trigal / Benavides",
    district: "Santiago de Surco",
    address:
      "C. Los Antares 298 / Cruce Av. Velasco Astete con Benavides, Santiago de Surco 15038",
    courtCount: 8,
    courtType: "outdoor",
    phone: "+51 921 633 793",
    whatsappUrl: toWhatsAppUrl("+51 921 633 793"),
    instagramUrl: "https://www.instagram.com/onepadelperu/",
    googleMapsUrl: toGoogleMapsUrl(-12.126721, -76.987887),
    imageUrl:
      "https://onepadel-pe.matchpoint.com.es/Pages/images.ashx?id=a0566d3404cadc78f2635596de2ef581",
    amenities: [
      "Estacionamiento",
      "Camerinos",
      "Cafeteria",
      "Tienda",
      "Zona social",
      "Zona de parrilla",
    ],
    hours: "Lun-Dom 6:00-23:00",
    bookingSlug: null,
  },
  {
    id: "mad-padel-surco",
    name: "Mad Padel - Surco Indoor",
    district: "Santiago de Surco",
    address: "Jirón Venegas 896, Santiago de Surco 15049",
    courtCount: null,
    courtType: "indoor",
    phone: "+51 932 208 437",
    whatsappUrl: toWhatsAppUrl("+51 932 208 437"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.140787, -77.012598),
    imageUrl:
      "https://res.cloudinary.com/playtomic/image/upload/c_limit,w_1600/v1/pro/tenants/364263d1-1c56-4230-a29e-08db754c11d9/madpadelindoorsb_0001",
    amenities: ["Estacionamiento", "Camerinos", "Zona social"],
    hours: null,
    bookingSlug: null,
  },
  {
    id: "top-padel-la-molina",
    name: "Top Padel - La Molina",
    district: "La Molina",
    address: "Av. Melgarejo 147, La Molina 15026",
    courtCount: 6,
    courtType: "outdoor",
    phone: "+51 940 513 952",
    whatsappUrl: toWhatsAppUrl("+51 940 513 952"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.074734, -76.936277),
    imageUrl:
      "https://res.cloudinary.com/playtomic/image/upload/c_limit,w_1600/v1/pro/tenants/696571d6-98d6-4d84-8e00-5a69b16edbb4/madpadellamolina_0003",
    amenities: ["Estacionamiento", "Tienda", "Cafeteria", "Terraza"],
    hours: "Lun-Dom 6:00-23:59",
    bookingSlug: null,
  },
  {
    id: "padel-center-miraflores",
    name: "Padel Center Miraflores",
    district: "Miraflores",
    address: "Av. Gral. Mendiburu 671, Miraflores 15074",
    courtCount: 2,
    courtType: "indoor",
    phone: "+51 934 377 679",
    whatsappUrl: toWhatsAppUrl("+51 934 377 679"),
    instagramUrl: "https://www.instagram.com/perupadelcenter/",
    googleMapsUrl: toGoogleMapsUrl(-12.114168, -77.046248),
    imageUrl:
      "https://perupadelcenter-pe.matchpoint.com.es/PeruPadelCenter/images.ashx?id=e613d1da3c2513cf8659346463edb00c",
    amenities: ["Camerinos", "Cafeteria", "Tienda"],
    hours: "Lun-Vie 6:00-22:30, Sab 7:30-22:30, Dom 9:00-21:00",
    bookingSlug: null,
  },
  {
    id: "bohemia-padel",
    name: "Bohemia Padel Club",
    district: "San Borja",
    address: "Av. San Borja Sur 1228, San Borja 15037",
    courtCount: null,
    courtType: "outdoor",
    phone: "+51 975 613 680",
    whatsappUrl: toWhatsAppUrl("+51 975 613 680"),
    instagramUrl: "https://www.instagram.com/bohemiapadelclub/",
    googleMapsUrl: toGoogleMapsUrl(-12.103283, -76.989795),
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWKeGBgSYKjxUEPszMjqtWYe8QK0-uPZo26A&s",
    amenities: ["Estacionamiento", "Camerinos", "Alquiler de equipos"],
    hours: "Lun-Dom 6:00-22:30",
    bookingSlug: null,
  },
  {
    id: "club-padel-lima",
    name: "Club Padel Lima (La Once)",
    district: "Surquillo",
    address: "Av. Tomás Marsano 630-A, Surquillo 15048",
    courtCount: 3,
    courtType: "outdoor",
    phone: "+51 963 571 563",
    whatsappUrl: toWhatsAppUrl("+51 963 571 563"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.112028, -77.012795),
    imageUrl: "https://www.laonce.com.pe/wp-content/uploads/2015/03/PADEL.jpg",
    amenities: ["Estacionamiento"],
    hours: "Lun-Vie 6:00-8:00 y 16:00-23:00, Sab-Dom 6:00-22:00",
    bookingSlug: null,
  },
  {
    id: "inside-court-padel",
    name: "Inside Court Padel",
    district: "La Molina",
    address: "La Molina 15026",
    courtCount: null,
    courtType: "outdoor",
    phone: "+51 964 290 667",
    whatsappUrl: toWhatsAppUrl("+51 964 290 667"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.082549, -76.910588),
    imageUrl:
      "https://padelmundial.com/wp-content/uploads/2024/11/inside-padel-court.jpeg",
    amenities: ["Estacionamiento"],
    hours: "Lun-Dom 6:00-23:00",
    bookingSlug: null,
  },
  {
    id: "padel-tenis-villa",
    name: "Club Pádel Tenis Villa",
    district: "Chorrillos",
    address: "Chorrillos 15067 (zona Villa)",
    courtCount: 2,
    courtType: "outdoor",
    phone: "+51 952 109 714",
    whatsappUrl: toWhatsAppUrl("+51 952 109 714"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.208965, -77.000057),
    imageUrl:
      "https://alquilatucancha-public.s3.sa-east-1.amazonaws.com/production/public/clubs/bg/club-padel-tenis-villa-lima.jpeg?857317",
    amenities: ["Cafeteria", "Terraza"],
    hours: "Lun-Dom 7:00-23:00",
    bookingSlug: null,
  },
  {
    id: "eureka-sports",
    name: "Eureka Sports - San Borja",
    district: "San Borja",
    address: "Av. del Aire 150, San Borja",
    courtCount: 2,
    courtType: "outdoor",
    phone: "+51 982 405 663",
    whatsappUrl: toWhatsAppUrl("+51 982 405 663"),
    instagramUrl: "https://www.instagram.com/eureka_sportsoficial/",
    googleMapsUrl: toGoogleMapsUrl(-12.0881777, -77.007399),
    imageUrl: "https://eurekasports.pe/wp-content/uploads/2024/07/pa2.png",
    amenities: ["Estacionamiento", "Alquiler de equipos"],
    hours: "Lun-Dom 7:30-22:30",
    bookingSlug: null,
  },
  {
    id: "adidas-x3-miraflores",
    name: "Club Adidas X3 - Padel",
    district: "Miraflores",
    address: "Av. Paseo de la República 5840, Miraflores 15074",
    courtCount: null,
    courtType: "outdoor",
    phone: "+51 913 861 726",
    whatsappUrl: toWhatsAppUrl("+51 913 861 726"),
    instagramUrl: null,
    googleMapsUrl: toGoogleMapsUrl(-12.124457, -77.024747),
    imageUrl: "/images/adidas-x3-miraflores.png",
    amenities: ["Estacionamiento"],
    hours: "Lun-Vie 6:00-23:00, Sab 7:30-23:00, Dom 7:30-21:00",
    bookingSlug: null,
  },
];

/** All unique districts from the facility list, sorted alphabetically */
export const districts: string[] = [
  ...new Set(facilities.map((f) => f.district)),
].sort();
