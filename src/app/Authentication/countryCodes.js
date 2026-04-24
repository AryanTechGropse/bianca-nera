"use client";
// Country code mapping for accurate extraction
export const countryCodeMap = {
  1: 1, // US, Canada
  7: 1, // Russia, Kazakhstan
  20: 2, // Egypt
  27: 2, // South Africa
  30: 2, // Greece
  31: 2, // Netherlands
  32: 2, // Belgium
  33: 2, // France
  34: 2, // Spain
  36: 2, // Hungary
  39: 2, // Italy
  40: 2, // Romania
  41: 2, // Switzerland
  43: 2, // Austria
  44: 2, // UK
  45: 2, // Denmark
  46: 2, // Sweden
  47: 2, // Norway
  48: 2, // Poland
  49: 2, // Germany
  51: 2, // Peru
  52: 2, // Mexico
  53: 2, // Cuba
  54: 2, // Argentina
  55: 2, // Brazil
  56: 2, // Chile
  57: 2, // Colombia
  58: 2, // Venezuela
  60: 2, // Malaysia
  61: 2, // Australia
  62: 2, // Indonesia
  63: 2, // Philippines
  64: 2, // New Zealand
  65: 2, // Singapore
  66: 2, // Thailand
  81: 2, // Japan
  82: 2, // South Korea
  84: 2, // Vietnam
  86: 2, // China
  90: 2, // Turkey
  91: 2, // India
  92: 2, // Pakistan
  93: 2, // Afghanistan
  94: 2, // Sri Lanka
  95: 2, // Myanmar
  98: 2, // Iran
  212: 3, // Morocco
  213: 3, // Algeria
  216: 3, // Tunisia
  218: 3, // Libya
  220: 3, // Gambia
  221: 3, // Senegal
  222: 3, // Mauritania
  223: 3, // Mali
  224: 3, // Guinea
  225: 3, // Ivory Coast
  226: 3, // Burkina Faso
  227: 3, // Niger
  228: 3, // Togo
  229: 3, // Benin
  230: 3, // Mauritius
  231: 3, // Liberia
  232: 3, // Sierra Leone
  233: 3, // Ghana
  234: 3, // Nigeria
  235: 3, // Chad
  236: 3, // Central African Republic
  237: 3, // Cameroon
  238: 3, // Cape Verde
  239: 3, // Sao Tome and Principe
  240: 3, // Equatorial Guinea
  241: 3, // Gabon
  242: 3, // Republic of the Congo
  243: 3, // Democratic Republic of the Congo
  244: 3, // Angola
  245: 3, // Guinea-Bissau
  246: 3, // British Indian Ocean Territory
  247: 3, // Ascension Island
  248: 3, // Seychelles
  249: 3, // Sudan
  250: 3, // Rwanda
  251: 3, // Ethiopia
  252: 3, // Somalia
  253: 3, // Djibouti
  254: 3, // Kenya
  255: 3, // Tanzania
  256: 3, // Uganda
  257: 3, // Burundi
  258: 3, // Mozambique
  260: 3, // Zambia
  261: 3, // Madagascar
  262: 3, // Reunion
  263: 3, // Zimbabwe
  264: 3, // Namibia
  265: 3, // Malawi
  266: 3, // Lesotho
  267: 3, // Botswana
  268: 3, // Swaziland
  269: 3, // Comoros
  290: 3, // Saint Helena
  291: 3, // Eritrea
  297: 3, // Aruba
  298: 3, // Faroe Islands
  299: 3, // Greenland
  350: 3, // Gibraltar
  351: 3, // Portugal
  352: 3, // Luxembourg
  353: 3, // Ireland
  354: 3, // Iceland
  355: 3, // Albania
  356: 3, // Malta
  357: 3, // Cyprus
  358: 3, // Finland
  359: 3, // Bulgaria
  370: 3, // Lithuania
  371: 3, // Latvia
  372: 3, // Estonia
  373: 3, // Moldova
  374: 3, // Armenia
  375: 3, // Belarus
  376: 3, // Andorra
  377: 3, // Monaco
  378: 3, // San Marino
  380: 3, // Ukraine
  381: 3, // Serbia
  382: 3, // Montenegro
  383: 3, // Kosovo
  385: 3, // Croatia
  386: 3, // Slovenia
  387: 3, // Bosnia and Herzegovina
  389: 3, // Macedonia
  420: 3, // Czech Republic
  421: 3, // Slovakia
  423: 3, // Liechtenstein
  500: 3, // Falkland Islands
  501: 3, // Belize
  502: 3, // Guatemala
  503: 3, // El Salvador
  504: 3, // Honduras
  505: 3, // Nicaragua
  506: 3, // Costa Rica
  507: 3, // Panama
  508: 3, // Saint Pierre and Miquelon
  509: 3, // Haiti
  590: 3, // Guadeloupe
  591: 3, // Bolivia
  592: 3, // Guyana
  593: 3, // Ecuador
  594: 3, // French Guiana
  595: 3, // Paraguay
  596: 3, // Martinique
  597: 3, // Suriname
  598: 3, // Uruguay
  599: 3, // Netherlands Antilles
  670: 3, // East Timor
  672: 3, // Australian External Territories
  673: 3, // Brunei
  674: 3, // Nauru
  675: 3, // Papua New Guinea
  676: 3, // Tonga
  677: 3, // Solomon Islands
  678: 3, // Vanuatu
  679: 3, // Fiji
  680: 3, // Palau
  681: 3, // Wallis and Futuna
  682: 3, // Cook Islands
  683: 3, // Niue
  684: 3, // American Samoa
  685: 3, // Samoa
  686: 3, // Kiribati
  687: 3, // New Caledonia
  688: 3, // Tuvalu
  689: 3, // French Polynesia
  690: 3, // Tokelau
  691: 3, // Micronesia
  692: 3, // Marshall Islands
  850: 3, // North Korea
  852: 3, // Hong Kong
  853: 3, // Macau
  855: 3, // Cambodia
  856: 3, // Laos
  880: 3, // Bangladesh
  886: 3, // Taiwan
  960: 3, // Maldives
  961: 3, // Lebanon
  962: 3, // Jordan
  963: 3, // Syria
  964: 3, // Iraq
  965: 3, // Kuwait
  966: 3, // Saudi Arabia
  967: 3, // Yemen
  968: 3, // Oman
  970: 3, // Palestine
  971: 3, // United Arab Emirates
  972: 3, // Israel
  973: 3, // Bahrain
  974: 3, // Qatar
  975: 3, // Bhutan
  976: 3, // Mongolia
  977: 3, // Nepal
  992: 3, // Tajikistan
  993: 3, // Turkmenistan
  994: 3, // Azerbaijan
  995: 3, // Georgia
  996: 3, // Kyrgyzstan
  998: 3, // Uzbekistan
};
