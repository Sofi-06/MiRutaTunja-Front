import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://mirutatunja.com/#website",
      "url": "https://mirutatunja.com/",
      "name": "MiRutaTunja",
      "description": "Sistema de consulta de rutas y transporte público de Tunja, Boyacá",
      "inLanguage": "es-CO",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://mirutatunja.com/routes?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "GovernmentService",
      "@id": "https://mirutatunja.com/#service",
      "name": "MiRutaTunja - Servicio de Transporte Público Urbano",
      "serviceType": "Guía de Rutas y Movilidad Urbana",
      "provider": {
        "@type": "Organization",
        "name": "MiRutaTunja",
        "url": "https://mirutatunja.com"
      },
      "areaServed": {
        "@type": "City",
        "name": "Tunja",
        "sameAs": "https://es.wikipedia.org/wiki/Tunja"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Catálogo de Rutas Colectivo Urbano Tunja",
        "numberOfItems": 26
      }
    }
  ]
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es-CO">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#208AEF" />
        
        {/* Metadatos Primarios de SEO */}
        <title>MiRutaTunja - Rutas de Transporte Público y Colectivos en Tunja</title>
        <meta name="title" content="MiRutaTunja - Rutas de Transporte Público y Colectivos en Tunja" />
        <meta name="description" content="Consulta las 26 rutas de colectivo urbano en Tunja, explora recorridos, calcula trayectos multimodales y planifica tu movilidad fácil." />
        <meta name="keywords" content="rutas de bus tunja, transporte publico tunja, mi ruta tunja, colectivo tunja, bus urbano tunja, terminal de transportes tunja, uniboyaca tunja, uptc tunja" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mirutatunja.com/" />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mirutatunja.com/" />
        <meta property="og:site_name" content="MiRutaTunja" />
        <meta property="og:title" content="MiRutaTunja - Muévete fácil por Tunja" />
        <meta property="og:description" content="Consulta mapas, recorridos y horarios de las 26 rutas de transporte urbano en Tunja." />
        <meta property="og:locale" content="es_CO" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MiRutaTunja - Rutas de Transporte Público en Tunja" />
        <meta name="twitter:description" content="Encuentra tu ruta de bus en Tunja. 26 rutas urbanas con trazado interactivo en mapa." />

        {/* Datos Estructurados JSON-LD (Schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Estilos base de Expo Web */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
