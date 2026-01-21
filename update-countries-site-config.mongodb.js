
// MongoDB script to update site_config with standard country list
// and attempt to standardize existing country data in users/sellers collections

const countries = [
  {
    "name": "Afghanistan",
    "code": "004"
  },
  {
    "name": "Albania",
    "code": "008"
  },
  {
    "name": "Algeria",
    "code": "012"
  },
  {
    "name": "Angola",
    "code": "024"
  },
  {
    "name": "Antarctica",
    "code": "010"
  },
  {
    "name": "Argentina",
    "code": "032"
  },
  {
    "name": "Armenia",
    "code": "051"
  },
  {
    "name": "Australia",
    "code": "036"
  },
  {
    "name": "Austria",
    "code": "040"
  },
  {
    "name": "Azerbaijan",
    "code": "031"
  },
  {
    "name": "Bahamas",
    "code": "044"
  },
  {
    "name": "Bangladesh",
    "code": "050"
  },
  {
    "name": "Belarus",
    "code": "112"
  },
  {
    "name": "Belgium",
    "code": "056"
  },
  {
    "name": "Belize",
    "code": "084"
  },
  {
    "name": "Benin",
    "code": "204"
  },
  {
    "name": "Bhutan",
    "code": "064"
  },
  {
    "name": "Bolivia",
    "code": "068"
  },
  {
    "name": "Bosnia and Herz.",
    "code": "070"
  },
  {
    "name": "Botswana",
    "code": "072"
  },
  {
    "name": "Brazil",
    "code": "076"
  },
  {
    "name": "Brunei",
    "code": "096"
  },
  {
    "name": "Bulgaria",
    "code": "100"
  },
  {
    "name": "Burkina Faso",
    "code": "854"
  },
  {
    "name": "Burundi",
    "code": "108"
  },
  {
    "name": "Cambodia",
    "code": "116"
  },
  {
    "name": "Cameroon",
    "code": "120"
  },
  {
    "name": "Canada",
    "code": "124"
  },
  {
    "name": "Central African Rep.",
    "code": "140"
  },
  {
    "name": "Chad",
    "code": "148"
  },
  {
    "name": "Chile",
    "code": "152"
  },
  {
    "name": "China",
    "code": "156"
  },
  {
    "name": "Colombia",
    "code": "170"
  },
  {
    "name": "Congo",
    "code": "178"
  },
  {
    "name": "Costa Rica",
    "code": "188"
  },
  {
    "name": "Côte d'Ivoire",
    "code": "384"
  },
  {
    "name": "Croatia",
    "code": "191"
  },
  {
    "name": "Cuba",
    "code": "192"
  },
  {
    "name": "Cyprus",
    "code": "196"
  },
  {
    "name": "Czechia",
    "code": "203"
  },
  {
    "name": "Dem. Rep. Congo",
    "code": "180"
  },
  {
    "name": "Denmark",
    "code": "208"
  },
  {
    "name": "Djibouti",
    "code": "262"
  },
  {
    "name": "Dominican Rep.",
    "code": "214"
  },
  {
    "name": "Ecuador",
    "code": "218"
  },
  {
    "name": "Egypt",
    "code": "818"
  },
  {
    "name": "El Salvador",
    "code": "222"
  },
  {
    "name": "Eq. Guinea",
    "code": "226"
  },
  {
    "name": "Eritrea",
    "code": "232"
  },
  {
    "name": "Estonia",
    "code": "233"
  },
  {
    "name": "eSwatini",
    "code": "748"
  },
  {
    "name": "Ethiopia",
    "code": "231"
  },
  {
    "name": "Falkland Is.",
    "code": "238"
  },
  {
    "name": "Fiji",
    "code": "242"
  },
  {
    "name": "Finland",
    "code": "246"
  },
  {
    "name": "Fr. S. Antarctic Lands",
    "code": "260"
  },
  {
    "name": "France",
    "code": "250"
  },
  {
    "name": "Gabon",
    "code": "266"
  },
  {
    "name": "Gambia",
    "code": "270"
  },
  {
    "name": "Georgia",
    "code": "268"
  },
  {
    "name": "Germany",
    "code": "276"
  },
  {
    "name": "Ghana",
    "code": "288"
  },
  {
    "name": "Greece",
    "code": "300"
  },
  {
    "name": "Greenland",
    "code": "304"
  },
  {
    "name": "Guatemala",
    "code": "320"
  },
  {
    "name": "Guinea",
    "code": "324"
  },
  {
    "name": "Guinea-Bissau",
    "code": "624"
  },
  {
    "name": "Guyana",
    "code": "328"
  },
  {
    "name": "Haiti",
    "code": "332"
  },
  {
    "name": "Honduras",
    "code": "340"
  },
  {
    "name": "Hungary",
    "code": "348"
  },
  {
    "name": "Iceland",
    "code": "352"
  },
  {
    "name": "India",
    "code": "356"
  },
  {
    "name": "Indonesia",
    "code": "360"
  },
  {
    "name": "Iran",
    "code": "364"
  },
  {
    "name": "Iraq",
    "code": "368"
  },
  {
    "name": "Ireland",
    "code": "372"
  },
  {
    "name": "Israel",
    "code": "376"
  },
  {
    "name": "Italy",
    "code": "380"
  },
  {
    "name": "Jamaica",
    "code": "388"
  },
  {
    "name": "Japan",
    "code": "392"
  },
  {
    "name": "Jordan",
    "code": "400"
  },
  {
    "name": "Kazakhstan",
    "code": "398"
  },
  {
    "name": "Kenya",
    "code": "404"
  },
  {
    "name": "Kosovo"
  },
  {
    "name": "Kuwait",
    "code": "414"
  },
  {
    "name": "Kyrgyzstan",
    "code": "417"
  },
  {
    "name": "Laos",
    "code": "418"
  },
  {
    "name": "Latvia",
    "code": "428"
  },
  {
    "name": "Lebanon",
    "code": "422"
  },
  {
    "name": "Lesotho",
    "code": "426"
  },
  {
    "name": "Liberia",
    "code": "430"
  },
  {
    "name": "Libya",
    "code": "434"
  },
  {
    "name": "Lithuania",
    "code": "440"
  },
  {
    "name": "Luxembourg",
    "code": "442"
  },
  {
    "name": "Macedonia",
    "code": "807"
  },
  {
    "name": "Madagascar",
    "code": "450"
  },
  {
    "name": "Malawi",
    "code": "454"
  },
  {
    "name": "Malaysia",
    "code": "458"
  },
  {
    "name": "Mali",
    "code": "466"
  },
  {
    "name": "Mauritania",
    "code": "478"
  },
  {
    "name": "Mexico",
    "code": "484"
  },
  {
    "name": "Moldova",
    "code": "498"
  },
  {
    "name": "Mongolia",
    "code": "496"
  },
  {
    "name": "Montenegro",
    "code": "499"
  },
  {
    "name": "Morocco",
    "code": "504"
  },
  {
    "name": "Mozambique",
    "code": "508"
  },
  {
    "name": "Myanmar",
    "code": "104"
  },
  {
    "name": "N. Cyprus"
  },
  {
    "name": "Namibia",
    "code": "516"
  },
  {
    "name": "Nepal",
    "code": "524"
  },
  {
    "name": "Netherlands",
    "code": "528"
  },
  {
    "name": "New Caledonia",
    "code": "540"
  },
  {
    "name": "New Zealand",
    "code": "554"
  },
  {
    "name": "Nicaragua",
    "code": "558"
  },
  {
    "name": "Niger",
    "code": "562"
  },
  {
    "name": "Nigeria",
    "code": "566"
  },
  {
    "name": "North Korea",
    "code": "408"
  },
  {
    "name": "Norway",
    "code": "578"
  },
  {
    "name": "Oman",
    "code": "512"
  },
  {
    "name": "Pakistan",
    "code": "586"
  },
  {
    "name": "Palestine",
    "code": "275"
  },
  {
    "name": "Panama",
    "code": "591"
  },
  {
    "name": "Papua New Guinea",
    "code": "598"
  },
  {
    "name": "Paraguay",
    "code": "600"
  },
  {
    "name": "Peru",
    "code": "604"
  },
  {
    "name": "Philippines",
    "code": "608"
  },
  {
    "name": "Poland",
    "code": "616"
  },
  {
    "name": "Portugal",
    "code": "620"
  },
  {
    "name": "Puerto Rico",
    "code": "630"
  },
  {
    "name": "Qatar",
    "code": "634"
  },
  {
    "name": "Romania",
    "code": "642"
  },
  {
    "name": "Russia",
    "code": "643"
  },
  {
    "name": "Rwanda",
    "code": "646"
  },
  {
    "name": "S. Sudan",
    "code": "728"
  },
  {
    "name": "Saudi Arabia",
    "code": "682"
  },
  {
    "name": "Senegal",
    "code": "686"
  },
  {
    "name": "Serbia",
    "code": "688"
  },
  {
    "name": "Sierra Leone",
    "code": "694"
  },
  {
    "name": "Slovakia",
    "code": "703"
  },
  {
    "name": "Slovenia",
    "code": "705"
  },
  {
    "name": "Solomon Is.",
    "code": "090"
  },
  {
    "name": "Somalia",
    "code": "706"
  },
  {
    "name": "Somaliland"
  },
  {
    "name": "South Africa",
    "code": "710"
  },
  {
    "name": "South Korea",
    "code": "410"
  },
  {
    "name": "Spain",
    "code": "724"
  },
  {
    "name": "Sri Lanka",
    "code": "144"
  },
  {
    "name": "Sudan",
    "code": "729"
  },
  {
    "name": "Suriname",
    "code": "740"
  },
  {
    "name": "Sweden",
    "code": "752"
  },
  {
    "name": "Switzerland",
    "code": "756"
  },
  {
    "name": "Syria",
    "code": "760"
  },
  {
    "name": "Taiwan",
    "code": "158"
  },
  {
    "name": "Tajikistan",
    "code": "762"
  },
  {
    "name": "Tanzania",
    "code": "834"
  },
  {
    "name": "Thailand",
    "code": "764"
  },
  {
    "name": "Timor-Leste",
    "code": "626"
  },
  {
    "name": "Togo",
    "code": "768"
  },
  {
    "name": "Trinidad and Tobago",
    "code": "780"
  },
  {
    "name": "Tunisia",
    "code": "788"
  },
  {
    "name": "Turkey",
    "code": "792"
  },
  {
    "name": "Turkmenistan",
    "code": "795"
  },
  {
    "name": "Uganda",
    "code": "800"
  },
  {
    "name": "Ukraine",
    "code": "804"
  },
  {
    "name": "United Arab Emirates",
    "code": "784"
  },
  {
    "name": "United Kingdom",
    "code": "826"
  },
  {
    "name": "United States of America",
    "code": "840"
  },
  {
    "name": "Uruguay",
    "code": "858"
  },
  {
    "name": "Uzbekistan",
    "code": "860"
  },
  {
    "name": "Vanuatu",
    "code": "548"
  },
  {
    "name": "Venezuela",
    "code": "862"
  },
  {
    "name": "Vietnam",
    "code": "704"
  },
  {
    "name": "W. Sahara",
    "code": "732"
  },
  {
    "name": "Yemen",
    "code": "887"
  },
  {
    "name": "Zambia",
    "code": "894"
  },
  {
    "name": "Zimbabwe",
    "code": "716"
  }
];

// 1. Update site_config with the master list of countries
const dbName = 'test'; // Replace with your actual database name if different, usually the connection string handles it but safe to be explicit if needed, or just use 'db'
// In MongoDB Compass or Mongosh, 'db' is the current database.

print("Updating site_config with " + countries.length + " countries...");

// Find the site_config document (assuming single config or take the first)
// upsert: true will create it if not exists, but usually we update existing
db.site_config.updateMany(
  {}, // Update all (should be one)
  {
    $set: {
      countries: countries
    }
  }
);
print("site_config updated.");

// 2. Helper function to find standard country name
function getStandardCountry(input) {
  if (!input) return null;
  const lowerInput = input.trim().toLowerCase();
  
  // Direct match
  const exact = countries.find(c => c.name.toLowerCase() === lowerInput);
  if (exact) return exact.name;

  // Code match
  const codeMatch = countries.find(c => c.code === input.trim());
  if (codeMatch) return codeMatch.name;

  // Partial/Fuzzy Map (Add common variations)
  // You can extend this map based on your existing dirty data
  if (lowerInput === 'usa' || lowerInput === 'us' || lowerInput.includes('united states')) return 'United States of America';
  if (lowerInput === 'uk' || lowerInput === 'gb' || lowerInput.includes('united kingdom')) return 'United Kingdom';
  if (lowerInput === 'vn' || lowerInput === 'vietnam') return 'Vietnam';
  if (lowerInput === 'de') return 'Germany';
  if (lowerInput === 'fr') return 'France';
  if (lowerInput === 'cn') return 'China';
  if (lowerInput === 'jp') return 'Japan';
  if (lowerInput === 'kr') return 'South Korea';
  if (lowerInput === 'ru') return 'Russia';
  
  return null;
}

// 3. Update Sellers
print("Standardizing Seller countries...");
db.sellers.find().forEach(doc => {
  if (doc.country) {
    const std = getStandardCountry(doc.country);
    if (std && std !== doc.country) {
      db.sellers.updateOne({ _id: doc._id }, { $set: { country: std } });
      print("Updated seller " + doc.email + ": " + doc.country + " -> " + std);
    }
  }
});

// 4. Update Addresses
print("Standardizing User Addresses...");
db.address.find().forEach(doc => {
  if (doc.country) {
    const std = getStandardCountry(doc.country);
    if (std && std !== doc.country) {
      db.address.updateOne({ _id: doc._id }, { $set: { country: std } });
    }
  }
});

// 5. Update userAnalytics
print("Standardizing UserAnalytics...");
db.userAnalytics.find().forEach(doc => {
  if (doc.country) {
    const std = getStandardCountry(doc.country);
    if (std && std !== doc.country) {
      db.userAnalytics.updateOne({ _id: doc._id }, { $set: { country: std } });
    }
  }
});

print("Done.");
