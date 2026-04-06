/**
 * Merges generated trivia into data/prompts.json (dedupes by question text).
 * Run: node scripts/generate-trivia-library.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS = join(__dirname, '../data/prompts.json');

function shuffleOptions(correct, wrongThree) {
  const opts = [correct, ...wrongThree];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const answer = opts.indexOf(correct);
  if (answer < 0) throw new Error('shuffle failed');
  return { options: opts, answer };
}

function q(question, category, correct, wrong) {
  const { options, answer } = shuffleOptions(correct, wrong);
  return { question, category, options, answer };
}

/** @type {{question:string,category:string,options:string[],answer:number}[]} */
const generated = [];

// --- World capitals (sample of countries) ---
const capitals = [
  ['Argentina', 'Buenos Aires', 'Lima', 'Santiago', 'Montevideo'],
  ['Chile', 'Santiago', 'Lima', 'Bogotá', 'Quito'],
  ['Colombia', 'Bogotá', 'Caracas', 'Quito', 'Lima'],
  ['Peru', 'Lima', 'Quito', 'La Paz', 'Bogotá'],
  ['Venezuela', 'Caracas', 'Bogotá', 'Lima', 'Quito'],
  ['Cuba', 'Havana', 'Kingston', 'Nassau', 'San Juan'],
  ['Jamaica', 'Kingston', 'Havana', 'Port-au-Prince', 'Bridgetown'],
  ['Ireland', 'Dublin', 'Edinburgh', 'Cardiff', 'Belfast'],
  ['Portugal', 'Lisbon', 'Madrid', 'Barcelona', 'Seville'],
  ['Greece', 'Athens', 'Istanbul', 'Sofia', 'Bucharest'],
  ['Norway', 'Oslo', 'Stockholm', 'Copenhagen', 'Helsinki'],
  ['Sweden', 'Stockholm', 'Oslo', 'Reykjavik', 'Bergen'],
  ['Denmark', 'Copenhagen', 'Oslo', 'Hamburg', 'Aarhus'],
  ['Finland', 'Helsinki', 'Oslo', 'Tallinn', 'Riga'],
  ['Poland', 'Warsaw', 'Prague', 'Budapest', 'Vienna'],
  ['Austria', 'Vienna', 'Prague', 'Zurich', 'Munich'],
  ['Switzerland', 'Bern', 'Zurich', 'Geneva', 'Vienna'],
  ['Belgium', 'Brussels', 'Amsterdam', 'Paris', 'Luxembourg'],
  ['Netherlands', 'Amsterdam', 'Brussels', 'Rotterdam', 'The Hague'],
  ['Czech Republic', 'Prague', 'Bratislava', 'Warsaw', 'Budapest'],
  ['Hungary', 'Budapest', 'Bucharest', 'Belgrade', 'Vienna'],
  ['Romania', 'Bucharest', 'Sofia', 'Belgrade', 'Budapest'],
  ['Bulgaria', 'Sofia', 'Bucharest', 'Athens', 'Belgrade'],
  ['Serbia', 'Belgrade', 'Sarajevo', 'Zagreb', 'Skopje'],
  ['Croatia', 'Zagreb', 'Ljubljana', 'Belgrade', 'Podgorica'],
  ['Ukraine', 'Kyiv', 'Minsk', 'Warsaw', 'Odessa'],
  ['Turkey', 'Ankara', 'Istanbul', 'Izmir', 'Athens'],
  ['Iran', 'Tehran', 'Baghdad', 'Riyadh', 'Kabul'],
  ['Iraq', 'Baghdad', 'Tehran', 'Damascus', 'Riyadh'],
  ['Saudi Arabia', 'Riyadh', 'Dubai', 'Cairo', 'Doha'],
  ['United Arab Emirates', 'Abu Dhabi', 'Dubai', 'Doha', 'Muscat'],
  ['Israel', 'Jerusalem', 'Tel Aviv', 'Amman', 'Beirut'],
  ['Egypt', 'Cairo', 'Alexandria', 'Tripoli', 'Khartoum'],
  ['South Africa', 'Pretoria', 'Johannesburg', 'Cape Town', 'Durban'],
  ['Kenya', 'Nairobi', 'Kampala', 'Dar es Salaam', 'Addis Ababa'],
  ['Nigeria', 'Abuja', 'Lagos', 'Accra', 'Dakar'],
  ['Morocco', 'Rabat', 'Casablanca', 'Algiers', 'Tunis'],
  ['Algeria', 'Algiers', 'Tunis', 'Tripoli', 'Rabat'],
  ['Ethiopia', 'Addis Ababa', 'Nairobi', 'Khartoum', 'Asmara'],
  ['Ghana', 'Accra', 'Lagos', 'Abidjan', 'Dakar'],
  ['Vietnam', 'Hanoi', 'Ho Chi Minh City', 'Bangkok', 'Phnom Penh'],
  ['Thailand', 'Bangkok', 'Hanoi', 'Phnom Penh', 'Vientiane'],
  ['Indonesia', 'Jakarta', 'Manila', 'Kuala Lumpur', 'Singapore'],
  ['Malaysia', 'Kuala Lumpur', 'Singapore', 'Jakarta', 'Bangkok'],
  ['Philippines', 'Manila', 'Jakarta', 'Hanoi', 'Taipei'],
  ['Pakistan', 'Islamabad', 'Karachi', 'Lahore', 'Kabul'],
  ['Bangladesh', 'Dhaka', 'Kolkata', 'Karachi', 'Colombo'],
  ['Nepal', 'Kathmandu', 'Thimphu', 'Dhaka', 'Lhasa'],
  ['Sri Lanka', 'Colombo', 'Chennai', 'Male', 'Dhaka'],
  ['Myanmar', 'Naypyidaw', 'Yangon', 'Bangkok', 'Hanoi'],
  ['Afghanistan', 'Kabul', 'Islamabad', 'Tehran', 'Tashkent'],
  ['Kazakhstan', 'Astana', 'Almaty', 'Tashkent', 'Bishkek'],
  ['Uzbekistan', 'Tashkent', 'Almaty', 'Ashgabat', 'Dushanbe'],
];

for (const [country, cap, w1, w2, w3] of capitals) {
  generated.push(
    q(`What is the capital of ${country}?`, 'geography', cap, [w1, w2, w3])
  );
}

// --- US state capitals ---
const usCapitals = [
  ['Alabama', 'Montgomery', 'Birmingham', 'Mobile', 'Huntsville'],
  ['Alaska', 'Juneau', 'Anchorage', 'Fairbanks', 'Sitka'],
  ['Arizona', 'Phoenix', 'Tucson', 'Flagstaff', 'Mesa'],
  ['Arkansas', 'Little Rock', 'Fayetteville', 'Hot Springs', 'Fort Smith'],
  ['California', 'Sacramento', 'Los Angeles', 'San Francisco', 'San Diego'],
  ['Colorado', 'Denver', 'Boulder', 'Colorado Springs', 'Aspen'],
  ['Connecticut', 'Hartford', 'New Haven', 'Stamford', 'Bridgeport'],
  ['Delaware', 'Dover', 'Wilmington', 'Newark', 'Rehoboth Beach'],
  ['Florida', 'Tallahassee', 'Miami', 'Orlando', 'Tampa'],
  ['Georgia', 'Atlanta', 'Savannah', 'Augusta', 'Macon'],
  ['Hawaii', 'Honolulu', 'Maui', 'Hilo', 'Kona'],
  ['Idaho', 'Boise', 'Idaho Falls', 'Coeur d\'Alene', 'Twin Falls'],
  ['Illinois', 'Springfield', 'Chicago', 'Peoria', 'Rockford'],
  ['Indiana', 'Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
  ['Iowa', 'Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
  ['Kansas', 'Topeka', 'Wichita', 'Kansas City', 'Lawrence'],
  ['Kentucky', 'Frankfort', 'Louisville', 'Lexington', 'Bowling Green'],
  ['Louisiana', 'Baton Rouge', 'New Orleans', 'Shreveport', 'Lafayette'],
  ['Maine', 'Augusta', 'Portland', 'Bangor', 'Bar Harbor'],
  ['Maryland', 'Annapolis', 'Baltimore', 'Frederick', 'Rockville'],
  ['Massachusetts', 'Boston', 'Worcester', 'Cambridge', 'Springfield'],
  ['Michigan', 'Lansing', 'Detroit', 'Grand Rapids', 'Ann Arbor'],
  ['Minnesota', 'Saint Paul', 'Minneapolis', 'Duluth', 'Rochester'],
  ['Mississippi', 'Jackson', 'Biloxi', 'Gulfport', 'Oxford'],
  ['Missouri', 'Jefferson City', 'Kansas City', 'St. Louis', 'Springfield'],
  ['Montana', 'Helena', 'Billings', 'Bozeman', 'Missoula'],
  ['Nebraska', 'Lincoln', 'Omaha', 'Grand Island', 'Kearney'],
  ['Nevada', 'Carson City', 'Las Vegas', 'Reno', 'Elko'],
  ['New Hampshire', 'Concord', 'Manchester', 'Nashua', 'Portsmouth'],
  ['New Jersey', 'Trenton', 'Newark', 'Jersey City', 'Atlantic City'],
  ['New Mexico', 'Santa Fe', 'Albuquerque', 'Taos', 'Las Cruces'],
  ['New York', 'Albany', 'New York City', 'Buffalo', 'Rochester'],
  ['North Carolina', 'Raleigh', 'Charlotte', 'Asheville', 'Durham'],
  ['North Dakota', 'Bismarck', 'Fargo', 'Grand Forks', 'Minot'],
  ['Ohio', 'Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
  ['Oklahoma', 'Oklahoma City', 'Tulsa', 'Norman', 'Stillwater'],
  ['Oregon', 'Salem', 'Portland', 'Eugene', 'Bend'],
  ['Pennsylvania', 'Harrisburg', 'Philadelphia', 'Pittsburgh', 'Erie'],
  ['Rhode Island', 'Providence', 'Newport', 'Warwick', 'Cranston'],
  ['South Carolina', 'Columbia', 'Charleston', 'Greenville', 'Myrtle Beach'],
  ['South Dakota', 'Pierre', 'Sioux Falls', 'Rapid City', 'Deadwood'],
  ['Tennessee', 'Nashville', 'Memphis', 'Knoxville', 'Chattanooga'],
  ['Texas', 'Austin', 'Houston', 'Dallas', 'San Antonio'],
  ['Utah', 'Salt Lake City', 'Provo', 'Park City', 'Moab'],
  ['Vermont', 'Montpelier', 'Burlington', 'Rutland', 'Brattleboro'],
  ['Virginia', 'Richmond', 'Norfolk', 'Virginia Beach', 'Roanoke'],
  ['Washington', 'Olympia', 'Seattle', 'Spokane', 'Tacoma'],
  ['West Virginia', 'Charleston', 'Morgantown', 'Huntington', 'Wheeling'],
  ['Wisconsin', 'Madison', 'Milwaukee', 'Green Bay', 'Kenosha'],
  ['Wyoming', 'Cheyenne', 'Casper', 'Jackson', 'Laramie'],
];

for (const [st, cap, w1, w2, w3] of usCapitals) {
  generated.push(
    q(`What is the capital of the U.S. state of ${st}?`, 'geography', cap, [w1, w2, w3])
  );
}

// --- Science: elements & basics ---
const elements = [
  ['Hydrogen', 'H', 'He', 'Li', 'O'],
  ['Helium', 'He', 'H', 'Ne', 'Ar'],
  ['Carbon', 'C', 'Ca', 'Co', 'Cu'],
  ['Nitrogen', 'N', 'Na', 'Ni', 'Ne'],
  ['Oxygen', 'O', 'Os', 'Og', 'P'],
  ['Sodium', 'Na', 'S', 'Ni', 'Nb'],
  ['Magnesium', 'Mg', 'Mn', 'Mo', 'Hg'],
  ['Aluminum', 'Al', 'Am', 'Ar', 'Ag'],
  ['Silicon', 'Si', 'S', 'Se', 'Sn'],
  ['Phosphorus', 'P', 'Pt', 'Pb', 'Po'],
  ['Sulfur', 'S', 'Si', 'Se', 'Sb'],
  ['Chlorine', 'Cl', 'C', 'Ca', 'Cr'],
  ['Potassium', 'K', 'P', 'Kr', 'Ka'],
  ['Calcium', 'Ca', 'C', 'Cl', 'Cd'],
  ['Iron', 'Fe', 'F', 'Ir', 'Fr'],
  ['Copper', 'Cu', 'Co', 'Cr', 'Ca'],
  ['Zinc', 'Zn', 'Zr', 'Z', 'Si'],
  ['Silver', 'Ag', 'Au', 'Al', 'As'],
  ['Gold', 'Au', 'Ag', 'Al', 'Ac'],
  ['Lead', 'Pb', 'Pd', 'Pt', 'Po'],
  ['Mercury', 'Hg', 'He', 'Ho', 'Hf'],
  ['Tin', 'Sn', 'Si', 'Sb', 'Sr'],
  ['Uranium', 'U', 'Un', 'Ur', 'Ub'],
];

for (const [name, sym, w1, w2, w3] of elements) {
  generated.push(
    q(`What is the chemical symbol for ${name}?`, 'science', sym, [w1, w2, w3])
  );
}

const scienceFacts = [
  ['How many bones are in an adult human body?', '206', '186', '226', '256'],
  ['Roughly how long does Earth take to orbit the Sun?', '365 days', '360 days', '400 days', '30 days'],
  ['What gas do plants absorb from the air for photosynthesis?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'],
  ['What is the center of an atom called?', 'Nucleus', 'Neutron', 'Electron shell', 'Proton cloud'],
  ['What force keeps us on the ground?', 'Gravity', 'Magnetism', 'Friction', 'Tension'],
  ['What is the boiling point of water at sea level (°C)?', '100', '90', '80', '212'],
  ['What planet is known for its rings?', 'Saturn', 'Jupiter', 'Mars', 'Neptune'],
  ['What is the closest star to Earth?', 'The Sun', 'Proxima Centauri', 'Sirius', 'Polaris'],
  ['What part of the cell contains DNA?', 'Nucleus', 'Ribosome', 'Mitochondria', 'Membrane'],
  ['What blood type is known as the universal donor?', 'O negative', 'AB positive', 'A positive', 'B negative'],
  ['What organ pumps blood through the body?', 'Heart', 'Liver', 'Lung', 'Kidney'],
  ['What is H2SO4 commonly known as?', 'Sulfuric acid', 'Hydrochloric acid', 'Nitric acid', 'Acetic acid'],
  ['What is the hardest mineral on the Mohs scale?', 'Diamond', 'Quartz', 'Topaz', 'Steel'],
  ['What is the largest organ in the human body?', 'Skin', 'Liver', 'Brain', 'Lung'],
  ['What gas makes up most of Earth\'s atmosphere?', 'Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'],
  ['What is the study of fossils called?', 'Paleontology', 'Archaeology', 'Geology', 'Biology'],
  ['What is the powerhouse of the cell?', 'Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'],
  ['What is the normal human body temperature in °C?', '37', '36', '38', '40'],
  ['What vitamin is produced when skin is exposed to sunlight?', 'Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'],
  ['What is the smallest unit of life?', 'Cell', 'Atom', 'Molecule', 'Tissue'],
  ['What type of animal is a frog?', 'Amphibian', 'Reptile', 'Mammal', 'Fish'],
  ['What is the largest land animal?', 'African elephant', 'Blue whale', 'Giraffe', 'Hippo'],
  ['What is the chemical formula for table salt?', 'NaCl', 'NaOH', 'HCl', 'KCl'],
  ['What planet is the hottest in the solar system?', 'Venus', 'Mercury', 'Mars', 'Jupiter'],
  ['What is the study of weather called?', 'Meteorology', 'Astronomy', 'Geology', 'Oceanography'],
  ['What is the speed of sound in air (approx, m/s)?', '343', '150', '500', '1000'],
  ['What is the main gas in the Sun?', 'Hydrogen', 'Helium', 'Oxygen', 'Carbon'],
  ['What is the process by which plants make food?', 'Photosynthesis', 'Respiration', 'Digestion', 'Fermentation'],
  ['What is the nearest galaxy to the Milky Way?', 'Andromeda', 'Triangulum', 'Sombrero', 'Whirlpool'],
  ['How many chromosomes do humans typically have?', '46', '23', '48', '44'],
];

for (const [question, c, w1, w2, w3] of scienceFacts) {
  generated.push(q(question, 'science', c, [w1, w2, w3]));
}

// --- History ---
const historyFacts = [
  ['In what year did World War I begin?', '1914', '1912', '1916', '1918'],
  ['Who was the first President of the United States?', 'George Washington', 'Thomas Jefferson', 'John Adams', 'Benjamin Franklin'],
  ['The ancient city of Pompeii was destroyed by which volcano?', 'Mount Vesuvius', 'Etna', 'Stromboli', 'Krakatoa'],
  ['Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
  ['What wall fell in 1989, symbolizing the Cold War\'s end?', 'Berlin Wall', 'Great Wall', 'Hadrian\'s Wall', 'Western Wall'],
  ['Who was known as the Maid of Orléans?', 'Joan of Arc', 'Marie Antoinette', 'Catherine de Medici', 'Eleanor of Aquitaine'],
  ['What ship sank in 1912 after hitting an iceberg?', 'Titanic', 'Lusitania', 'Britannic', 'Olympic'],
  ['Who wrote the Declaration of Independence (primary author)?', 'Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'],
  ['What empire was ruled by Julius Caesar?', 'Roman', 'Byzantine', 'Ottoman', 'Persian'],
  ['In what year did the American Revolutionary War end?', '1783', '1776', '1812', '1799'],
  ['Who was British Prime Minister during most of World War II?', 'Winston Churchill', 'Neville Chamberlain', 'Clement Attlee', 'Anthony Eden'],
  ['What ancient wonder was located in Alexandria?', 'Lighthouse (Pharos)', 'Hanging Gardens', 'Colossus', 'Temple of Artemis'],
  ['Who was the first emperor of China\'s Qin dynasty?', 'Qin Shi Huang', 'Liu Bang', 'Wu Zetian', 'Kublai Khan'],
  ['What year did the Titanic sink?', '1912', '1910', '1914', '1905'],
  ['Who discovered penicillin?', 'Alexander Fleming', 'Louis Pasteur', 'Marie Curie', 'Robert Koch'],
  ['What year did the Berlin Wall fall?', '1989', '1987', '1991', '1985'],
  ['Who was the first woman to fly solo across the Atlantic?', 'Amelia Earhart', 'Bessie Coleman', 'Harriet Quimby', 'Sally Ride'],
  ['What was the first country to give women the right to vote (1893)?', 'New Zealand', 'USA', 'UK', 'France'],
  ['Who was the longest-reigning British monarch before Elizabeth II?', 'Queen Victoria', 'George III', 'Henry VIII', 'James I'],
  ['What war was fought between the North and South in the United States?', 'Civil War', 'Revolutionary War', 'War of 1812', 'Spanish-American War'],
];

for (const [question, c, w1, w2, w3] of historyFacts) {
  generated.push(q(question, 'history', c, [w1, w2, w3]));
}

// --- Math ---
const mathFacts = [
  ['What is 7 × 8?', '56', '54', '63', '49'],
  ['What is the value of π to two decimal places?', '3.14', '3.41', '2.71', '1.62'],
  ['What is 12 squared?', '144', '132', '156', '121'],
  ['What is the sum of angles in a triangle (degrees)?', '180', '360', '90', '270'],
  ['What is 15% of 200?', '30', '25', '35', '40'],
  ['How many sides does a hexagon have?', '6', '5', '7', '8'],
  ['What is 2^10?', '1024', '512', '2048', '1000'],
  ['What is the square root of 81?', '9', '8', '7', '10'],
  ['If x + 3 = 10, what is x?', '7', '6', '13', '3'],
  ['How many degrees in a right angle?', '90', '45', '180', '360'],
  ['What is 100 ÷ 4?', '25', '20', '30', '24'],
  ['What is the perimeter of a square with side 5?', '20', '15', '25', '10'],
  ['What is 0.5 as a fraction?', '1/2', '1/3', '2/3', '1/4'],
  ['How many millimeters in a centimeter?', '10', '100', '1000', '1'],
  ['What is the next prime number after 7?', '11', '9', '13', '10'],
];

for (const [question, c, w1, w2, w3] of mathFacts) {
  generated.push(q(question, 'math', c, [w1, w2, w3]));
}

// --- Sports ---
const sportsFacts = [
  ['How many innings are in a standard MLB baseball game (regulation)?', '9', '7', '8', '10'],
  ['In tennis, what is zero called?', 'Love', 'Nil', 'Zero', 'Duck'],
  ['How many players on a basketball team on the court?', '5', '6', '4', '7'],
  ['What sport uses a puck?', 'Ice hockey', 'Field hockey', 'Lacrosse', 'Polo'],
  ['How long is a marathon (approximate miles)?', '26.2', '25', '24', '30'],
  ['In football (American), how many points for a touchdown?', '6', '7', '3', '2'],
  ['What color flag is waved for a clean lap in motorsport (F1)?', 'Checkered', 'Green', 'Yellow', 'Red'],
  ['How many holes in a standard round of golf?', '18', '9', '12', '36'],
  ['What sport is Wimbledon associated with?', 'Tennis', 'Cricket', 'Polo', 'Badminton'],
  ['In baseball, how many strikes for a strikeout?', '3', '2', '4', '5'],
  ['What is the national summer sport of Canada?', 'Lacrosse', 'Hockey', 'Curling', 'Soccer'],
  ['How many periods in a standard NHL hockey game?', '3', '2', '4', '1'],
  ['What do you call three strikes in a row in bowling?', 'Turkey', 'Eagle', 'Birdie', 'Spare'],
  ['In soccer, what card means ejection?', 'Red', 'Yellow', 'Green', 'Blue'],
  ['How many bases are on a baseball diamond?', '4', '3', '5', '2'],
];

for (const [question, c, w1, w2, w3] of sportsFacts) {
  generated.push(q(question, 'sports', c, [w1, w2, w3]));
}

// --- Literature & language ---
const litFacts = [
  ['Who wrote "Pride and Prejudice"?', 'Jane Austen', 'Charlotte Brontë', 'Emily Dickinson', 'Mary Shelley'],
  ['Who wrote "Moby-Dick"?', 'Herman Melville', 'Mark Twain', 'Nathaniel Hawthorne', 'Edgar Allan Poe'],
  ['What is the first book of the Bible?', 'Genesis', 'Exodus', 'Matthew', 'Psalms'],
  ['Who wrote "The Great Gatsby"?', 'F. Scott Fitzgerald', 'Ernest Hemingway', 'John Steinbeck', 'William Faulkner'],
  ['What is a group of crows called?', 'Murder', 'Flock', 'Pack', 'Gaggle'],
  ['What is the past tense of "go"?', 'Went', 'Gone', 'Goed', 'Goes'],
  ['How many syllables in "beautiful"?', '3', '2', '4', '1'],
  ['What is the plural of "child"?', 'Children', 'Childs', 'Childrens', 'Childes'],
  ['Who wrote "Hamlet"?', 'William Shakespeare', 'Christopher Marlowe', 'Ben Jonson', 'John Milton'],
  ['What figure of speech compares using "like" or "as"?', 'Simile', 'Metaphor', 'Hyperbole', 'Alliteration'],
];

for (const [question, c, w1, w2, w3] of litFacts) {
  generated.push(q(question, 'literature', c, [w1, w2, w3]));
}

// --- Movies & TV ---
const movieFacts = [
  ['Who played Jack Sparrow in "Pirates of the Caribbean"?', 'Johnny Depp', 'Orlando Bloom', 'Brad Pitt', 'Tom Hanks'],
  ['What is the name of the kingdom in "Frozen"?', 'Arendelle', 'Corona', 'DunBroch', 'Atlantica'],
  ['What is Darth Vader\'s real name?', 'Anakin Skywalker', 'Luke Skywalker', 'Obi-Wan Kenobi', 'Han Solo'],
  ['Which studio made "Toy Story"?', 'Pixar', 'DreamWorks', 'Disney Animation', 'Blue Sky'],
  ['What is the highest-grossing film franchise (often cited)?', 'Marvel Cinematic Universe', 'Star Wars', 'Harry Potter', 'James Bond'],
  ['Who directed "Jaws"?', 'Steven Spielberg', 'George Lucas', 'Martin Scorsese', 'Alfred Hitchcock'],
  ['What is the name of the hobbit played by Elijah Wood in LOTR?', 'Frodo', 'Bilbo', 'Sam', 'Pippin'],
  ['In "The Matrix," what color pill does Neo take?', 'Red', 'Blue', 'Green', 'Yellow'],
  ['What is the name of Simba\'s father in "The Lion King"?', 'Mufasa', 'Scar', 'Zazu', 'Timon'],
  ['Which film features the quote "May the Force be with you"?', 'Star Wars', 'Star Trek', 'Dune', 'Blade Runner'],
];

for (const [question, c, w1, w2, w3] of movieFacts) {
  generated.push(q(question, 'movies', c, [w1, w2, w3]));
}

// --- Music ---
const musicFacts = [
  ['Who is known as "The King of Rock and Roll"?', 'Elvis Presley', 'Chuck Berry', 'Little Richard', 'Buddy Holly'],
  ['What instrument did Jimi Hendrix famously play?', 'Guitar', 'Drums', 'Piano', 'Saxophone'],
  ['Who composed "The Four Seasons"?', 'Antonio Vivaldi', 'Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven'],
  ['What is the term for a musical speed?', 'Tempo', 'Pitch', 'Tone', 'Scale'],
  ['How many keys on a standard piano?', '88', '76', '66', '96'],
  ['Who sang "Like a Rolling Stone"?', 'Bob Dylan', 'Bruce Springsteen', 'Neil Young', 'Tom Petty'],
  ['What family do violin, viola, and cello belong to?', 'String', 'Brass', 'Woodwind', 'Percussion'],
  ['What does "forte" mean in music?', 'Loud', 'Soft', 'Fast', 'Slow'],
  ['Who is known as "The Boss" in rock?', 'Bruce Springsteen', 'Bob Dylan', 'Mick Jagger', 'Bono'],
  ['What note is middle C?', 'C4', 'C3', 'C5', 'C2'],
];

for (const [question, c, w1, w2, w3] of musicFacts) {
  generated.push(q(question, 'music', c, [w1, w2, w3]));
}

// --- Food ---
const foodFacts = [
  ['What is sushi traditionally wrapped with?', 'Nori', 'Rice paper', 'Lettuce', 'Tortilla'],
  ['What is the main ingredient in hummus?', 'Chickpeas', 'Lentils', 'Black beans', 'Peas'],
  ['What type of pasta means "little worms"?', 'Vermicelli', 'Penne', 'Fusilli', 'Rigatoni'],
  ['What spirit is in a traditional mojito?', 'Rum', 'Vodka', 'Gin', 'Whiskey'],
  ['Which fruit has its seeds on the outside?', 'Strawberry', 'Blueberry', 'Raspberry', 'Blackberry'],
  ['What is the national dish of Spain often associated with saffron rice?', 'Paella', 'Gazpacho', 'Tortilla', 'Tapas'],
  ['What cheese is traditionally on a Greek salad?', 'Feta', 'Mozzarella', 'Cheddar', 'Parmesan'],
  ['What is the main protein in traditional pad thai?', 'Shrimp or chicken', 'Beef', 'Pork', 'Tofu only'],
  ['Borscht is a soup most associated with which region?', 'Eastern Europe', 'Italy', 'Japan', 'Mexico'],
  ['What gives kimchi its spicy flavor?', 'Chili paste', 'Wasabi', 'Horseradish', 'Paprika only'],
];

for (const [question, c, w1, w2, w3] of foodFacts) {
  generated.push(q(question, 'food', c, [w1, w2, w3]));
}

// --- Tech ---
const techFacts = [
  ['What does CPU stand for?', 'Central Processing Unit', 'Computer Personal Unit', 'Core Processing Utility', 'Central Program Unit'],
  ['What does HTML stand for?', 'HyperText Markup Language', 'HighText Machine Language', 'HyperTransfer Markup Language', 'Home Tool Markup Language'],
  ['What company makes Android?', 'Google', 'Apple', 'Microsoft', 'Samsung'],
  ['What does URL stand for?', 'Uniform Resource Locator', 'Universal Reference Link', 'Unified Resource Link', 'Uniform Reference Locator'],
  ['What year was the World Wide Web invented (approx)?', '1989', '1985', '1995', '1979'],
  ['What does PDF stand for?', 'Portable Document Format', 'Public Document File', 'Printed Document Format', 'Portable Data File'],
  ['What is the name of Apple\'s voice assistant?', 'Siri', 'Alexa', 'Cortana', 'Google Assistant'],
  ['What does USB stand for?', 'Universal Serial Bus', 'United System Bus', 'Universal System Bridge', 'Ultra Serial Bus'],
  ['What does VPN stand for?', 'Virtual Private Network', 'Verified Public Network', 'Virtual Protected Node', 'Visual Private Network'],
  ['Who founded Microsoft with Paul Allen?', 'Bill Gates', 'Steve Jobs', 'Steve Wozniak', 'Mark Zuckerberg'],
];

for (const [question, c, w1, w2, w3] of techFacts) {
  generated.push(q(question, 'tech', c, [w1, w2, w3]));
}

// --- General / culture ---
const generalFacts = [
  ['How many continents are there (commonly taught)?', '7', '5', '6', '8'],
  ['What is the largest country by area?', 'Russia', 'Canada', 'China', 'USA'],
  ['What is the smallest ocean?', 'Arctic Ocean', 'Indian Ocean', 'Southern Ocean', 'Atlantic Ocean'],
  ['How many sides does a stop sign have (US)?', '8', '6', '4', '10'],
  ['What is the main language spoken in Brazil?', 'Portuguese', 'Spanish', 'English', 'French'],
  ['What is the currency of Japan?', 'Yen', 'Won', 'Yuan', 'Ringgit'],
  ['What is the tallest animal?', 'Giraffe', 'Elephant', 'Ostrich', 'Camel'],
  ['How many legs does a spider have?', '8', '6', '10', '4'],
  ['What is the largest bird by wingspan?', 'Wandering albatross', 'Eagle', 'Condor', 'Pelican'],
  ['What is the capital of New Zealand?', 'Wellington', 'Auckland', 'Christchurch', 'Queenstown'],
  ['What ocean is Bermuda in?', 'Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean', 'Arctic Ocean'],
  ['What is the longest river in South America?', 'Amazon River', 'Orinoco', 'Paraná', 'Uruguay'],
  ['What is the smallest US state by area?', 'Rhode Island', 'Delaware', 'Connecticut', 'Hawaii'],
  ['What is the largest US state by area?', 'Alaska', 'Texas', 'California', 'Montana'],
  ['What is the national flower of Japan?', 'Cherry blossom', 'Rose', 'Lotus', 'Chrysanthemum'],
  ['What is the official language of Egypt?', 'Arabic', 'English', 'French', 'Coptic'],
  ['What is the hottest desert in the world?', 'Sahara Desert', 'Gobi Desert', 'Mojave Desert', 'Atacama Desert'],
  ['What is the coldest continent?', 'Antarctica', 'Asia', 'Europe', 'North America'],
  ['How many time zones does Russia span (approx)?', '11', '5', '8', '3'],
  ['What is the most spoken language in the world by native speakers?', 'Mandarin Chinese', 'English', 'Spanish', 'Hindi'],
];

for (const [question, c, w1, w2, w3] of generalFacts) {
  generated.push(q(question, 'general', c, [w1, w2, w3]));
}

// --- More world capitals ---
const capitals2 = [
  ['Mongolia', 'Ulaanbaatar', 'Astana', 'Urumqi', 'Irkutsk'],
  ['Cambodia', 'Phnom Penh', 'Hanoi', 'Vientiane', 'Yangon'],
  ['Laos', 'Vientiane', 'Hanoi', 'Bangkok', 'Phnom Penh'],
  ['Brunei', 'Bandar Seri Begawan', 'Kuala Lumpur', 'Jakarta', 'Manila'],
  ['Timor-Leste', 'Dili', 'Jakarta', 'Port Moresby', 'Honiara'],
  ['Fiji', 'Suva', 'Port Moresby', 'Apia', 'Nukuʻalofa'],
  ['Papua New Guinea', 'Port Moresby', 'Suva', 'Honiara', 'Dili'],
  ['New Zealand', 'Wellington', 'Auckland', 'Christchurch', 'Hamilton'],
  ['Madagascar', 'Antananarivo', 'Nairobi', 'Maputo', 'Harare'],
  ['Rwanda', 'Kigali', 'Kampala', 'Bujumbura', 'Dodoma'],
  ['Uganda', 'Kampala', 'Kigali', 'Nairobi', 'Dar es Salaam'],
  ['Tanzania', 'Dodoma', 'Dar es Salaam', 'Nairobi', 'Kampala'],
  ['Sudan', 'Khartoum', 'Cairo', 'Addis Ababa', 'Juba'],
  ['South Sudan', 'Juba', 'Khartoum', 'Kampala', 'Nairobi'],
  ['Libya', 'Tripoli', 'Benghazi', 'Tunis', 'Algiers'],
  ['Tunisia', 'Tunis', 'Algiers', 'Tripoli', 'Rabat'],
  ['Cameroon', 'Yaoundé', 'Douala', 'Libreville', 'Kinshasa'],
  ['Angola', 'Luanda', 'Kinshasa', 'Lusaka', 'Maputo'],
  ['Zambia', 'Lusaka', 'Harare', 'Gaborone', 'Windhoek'],
  ['Zimbabwe', 'Harare', 'Lusaka', 'Gaborone', 'Pretoria'],
  ['Botswana', 'Gaborone', 'Windhoek', 'Harare', 'Lusaka'],
  ['Namibia', 'Windhoek', 'Gaborone', 'Pretoria', 'Luanda'],
  ['Mozambique', 'Maputo', 'Harare', 'Lusaka', 'Antananarivo'],
  ['Senegal', 'Dakar', 'Bamako', 'Abidjan', 'Conakry'],
  ['Ivory Coast', 'Yamoussoukro', 'Abidjan', 'Accra', 'Lomé'],
  ['Mali', 'Bamako', 'Dakar', 'Niamey', 'Ouagadougou'],
  ['Burkina Faso', 'Ouagadougou', 'Bamako', 'Accra', 'Lomé'],
  ['Chad', 'N\'Djamena', 'Khartoum', 'Niamey', 'Yaoundé'],
  ['Democratic Republic of the Congo', 'Kinshasa', 'Brazzaville', 'Kigali', 'Luanda'],
  ['Republic of the Congo', 'Brazzaville', 'Kinshasa', 'Libreville', 'Luanda'],
  ['Gabon', 'Libreville', 'Brazzaville', 'Yaoundé', 'Luanda'],
  ['Ecuador', 'Quito', 'Guayaquil', 'Lima', 'Bogotá'],
  ['Bolivia', 'Sucre', 'La Paz', 'Lima', 'Asunción'],
  ['Paraguay', 'Asunción', 'Montevideo', 'Buenos Aires', 'La Paz'],
  ['Uruguay', 'Montevideo', 'Buenos Aires', 'Asunción', 'Santiago'],
  ['Guatemala', 'Guatemala City', 'San Salvador', 'Tegucigalpa', 'Managua'],
  ['Honduras', 'Tegucigalpa', 'Managua', 'San Salvador', 'Belmopan'],
  ['El Salvador', 'San Salvador', 'Tegucigalpa', 'Guatemala City', 'Managua'],
  ['Nicaragua', 'Managua', 'San José', 'Panama City', 'Tegucigalpa'],
  ['Costa Rica', 'San José', 'Managua', 'Panama City', 'Belmopan'],
  ['Panama', 'Panama City', 'San José', 'Bogotá', 'Caracas'],
  ['Belize', 'Belmopan', 'Guatemala City', 'San Salvador', 'Mexico City'],
  ['Bahamas', 'Nassau', 'Kingston', 'Havana', 'San Juan'],
  ['Barbados', 'Bridgetown', 'Port of Spain', 'Kingston', 'Castries'],
  ['Trinidad and Tobago', 'Port of Spain', 'Bridgetown', 'Georgetown', 'Paramaribo'],
  ['Iceland', 'Reykjavik', 'Oslo', 'Helsinki', 'Copenhagen'],
  ['Luxembourg', 'Luxembourg City', 'Brussels', 'Bern', 'Amsterdam'],
  ['Malta', 'Valletta', 'Naples', 'Palermo', 'Athens'],
  ['Cyprus', 'Nicosia', 'Athens', 'Ankara', 'Beirut'],
  ['Lebanon', 'Beirut', 'Damascus', 'Jerusalem', 'Amman'],
  ['Jordan', 'Amman', 'Beirut', 'Damascus', 'Baghdad'],
  ['Oman', 'Muscat', 'Abu Dhabi', 'Doha', 'Riyadh'],
  ['Yemen', 'Sana\'a', 'Aden', 'Muscat', 'Riyadh'],
  ['Qatar', 'Doha', 'Manama', 'Kuwait City', 'Abu Dhabi'],
  ['Kuwait', 'Kuwait City', 'Doha', 'Manama', 'Baghdad'],
  ['Bahrain', 'Manama', 'Doha', 'Kuwait City', 'Abu Dhabi'],
  ['Syria', 'Damascus', 'Beirut', 'Baghdad', 'Amman'],
];

for (const [country, cap, w1, w2, w3] of capitals2) {
  generated.push(
    q(`What is the capital of ${country}?`, 'geography', cap, [w1, w2, w3])
  );
}

// --- Animals & nature ---
const animalFacts = [
  ['What is the fastest land animal?', 'Cheetah', 'Lion', 'Gazelle', 'Horse'],
  ['What is a group of lions called?', 'Pride', 'Pack', 'Herd', 'Colony'],
  ['What is the largest species of shark?', 'Whale shark', 'Great white shark', 'Hammerhead', 'Tiger shark'],
  ['How many hearts does an octopus have?', '3', '1', '2', '4'],
  ['What is the only mammal capable of true flight?', 'Bat', 'Flying squirrel', 'Sugar glider', 'Colugo'],
  ['What is the largest species of bear?', 'Polar bear', 'Grizzly bear', 'Black bear', 'Panda'],
  ['What bird is known for mimicking sounds?', 'Mockingbird', 'Crow', 'Parrot', 'Nightingale'],
  ['What is a baby kangaroo called?', 'Joey', 'Calf', 'Cub', 'Pup'],
  ['What is the largest living reptile?', 'Saltwater crocodile', 'Komodo dragon', 'Anaconda', 'Galápagos tortoise'],
  ['What do bees make?', 'Honey', 'Wax only', 'Pollen', 'Nectar'],
  ['What is the tallest tree species (commonly cited)?', 'Coast redwood', 'Oak', 'Pine', 'Baobab'],
  ['What is the largest living structure on Earth?', 'Great Barrier Reef', 'Amazon rainforest', 'Grand Canyon', 'Himalayas'],
  ['What is a female deer called?', 'Doe', 'Stag', 'Fawn', 'Ewe'],
  ['What is the national bird of the United States?', 'Bald eagle', 'Turkey', 'Blue jay', 'Robin'],
  ['What is the slowest mammal?', 'Three-toed sloth', 'Koala', 'Manatee', 'Panda'],
  ['What is the largest living bird by weight?', 'Ostrich', 'Emu', 'Albatross', 'Condor'],
  ['What is a group of fish called?', 'School', 'Flock', 'Pack', 'Pod'],
  ['What is the only continent with no reptiles?', 'Antarctica', 'Europe', 'Australia', 'South America'],
  ['What is the largest big cat by weight?', 'Tiger', 'Lion', 'Jaguar', 'Leopard'],
  ['What is the study of plants called?', 'Botany', 'Zoology', 'Ecology', 'Geology'],
];

for (const [question, c, w1, w2, w3] of animalFacts) {
  generated.push(q(question, 'science', c, [w1, w2, w3]));
}

// --- Space & astronomy ---
const spaceFacts = [
  ['What is the largest planet in our solar system?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'],
  ['What is the smallest planet in our solar system?', 'Mercury', 'Mars', 'Venus', 'Pluto'],
  ['What galaxy is Earth in?', 'Milky Way', 'Andromeda', 'Triangulum', 'Sombrero'],
  ['What is a shooting star?', 'Meteor', 'Comet', 'Asteroid', 'Satellite'],
  ['What is the name of the first human in space?', 'Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'John Glenn'],
  ['Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins'],
  ['What is the Great Red Spot on Jupiter?', 'A storm', 'A crater', 'A moon', 'A volcano'],
  ['How long does Earth take to rotate once on its axis?', '24 hours', '12 hours', '365 days', '30 days'],
  ['What is the name of Earth\'s natural satellite?', 'Moon', 'Luna II', 'Titan', 'Europa'],
  ['What color is the sun (as seen from space)?', 'White', 'Yellow', 'Orange', 'Red'],
  ['What is the hottest planet in the solar system?', 'Venus', 'Mercury', 'Mars', 'Jupiter'],
  ['What planet has the most moons (as of common knowledge)?', 'Saturn', 'Jupiter', 'Uranus', 'Neptune'],
  ['What is a light-year a measure of?', 'Distance', 'Time', 'Brightness', 'Mass'],
  ['What force holds planets in orbit?', 'Gravity', 'Magnetism', 'Friction', 'Inertia'],
  ['What is the second planet from the Sun?', 'Venus', 'Earth', 'Mercury', 'Mars'],
];

for (const [question, c, w1, w2, w3] of spaceFacts) {
  generated.push(q(question, 'science', c, [w1, w2, w3]));
}

// --- Landmarks & geography misc ---
const landmarkFacts = [
  ['Where is the Eiffel Tower located?', 'Paris', 'London', 'Rome', 'Berlin'],
  ['Where is the Statue of Liberty located?', 'New York Harbor', 'Boston Harbor', 'Philadelphia', 'Washington D.C.'],
  ['Where is Machu Picchu?', 'Peru', 'Mexico', 'Bolivia', 'Colombia'],
  ['Where is the ancient city of Petra?', 'Jordan', 'Egypt', 'Israel', 'Syria'],
  ['Where is the Taj Mahal?', 'India', 'Pakistan', 'Bangladesh', 'Nepal'],
  ['Where is the Colosseum?', 'Rome', 'Athens', 'Istanbul', 'Cairo'],
  ['Where is Christ the Redeemer statue?', 'Rio de Janeiro', 'São Paulo', 'Buenos Aires', 'Lima'],
  ['Where is the Great Wall mainly located?', 'China', 'Japan', 'Korea', 'Mongolia'],
  ['Where is Stonehenge?', 'England', 'Scotland', 'Ireland', 'Wales'],
  ['Where is the Acropolis?', 'Athens', 'Rome', 'Cairo', 'Istanbul'],
  ['What is the longest mountain range in the world?', 'Andes', 'Himalayas', 'Rockies', 'Alps'],
  ['What is the deepest ocean trench (well-known)?', 'Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'Tonga Trench'],
  ['What is the largest island in the world?', 'Greenland', 'New Guinea', 'Borneo', 'Madagascar'],
  ['What is the largest freshwater lake by surface area?', 'Lake Superior', 'Lake Victoria', 'Lake Baikal', 'Lake Michigan'],
  ['What desert covers much of northern Africa?', 'Sahara Desert', 'Gobi Desert', 'Kalahari Desert', 'Mojave Desert'],
  ['What strait separates Europe and Africa at Gibraltar?', 'Strait of Gibraltar', 'Bosporus', 'Dardanelles', 'English Channel'],
  ['What is the largest country in South America?', 'Brazil', 'Argentina', 'Peru', 'Colombia'],
  ['What river runs through London?', 'Thames', 'Seine', 'Danube', 'Rhine'],
  ['What river runs through Paris?', 'Seine', 'Thames', 'Rhine', 'Loire'],
  ['What is the capital of Scotland?', 'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
];

for (const [question, c, w1, w2, w3] of landmarkFacts) {
  generated.push(q(question, 'geography', c, [w1, w2, w3]));
}

// --- Inventors & discoveries ---
const inventorFacts = [
  ['Who is credited with inventing the light bulb (practical incandescent)?', 'Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'James Watt'],
  ['Who developed the theory of general relativity?', 'Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Stephen Hawking'],
  ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'],
  ['Who invented the telephone?', 'Alexander Graham Bell', 'Thomas Edison', 'Guglielmo Marconi', 'Nikola Tesla'],
  ['Who proposed natural selection?', 'Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Alfred Russel Wallace'],
  ['Who discovered radium with her husband?', 'Marie Curie', 'Rosalind Franklin', 'Lise Meitner', 'Dorothy Hodgkin'],
  ['Who invented the World Wide Web?', 'Tim Berners-Lee', 'Bill Gates', 'Steve Jobs', 'Vint Cerf'],
  ['Who invented the printing press (movable type, European)?', 'Johannes Gutenberg', 'William Caxton', 'Benjamin Franklin', 'Galileo'],
  ['Who flew first in a powered airplane (1903)?', 'Wright brothers', 'Louis Blériot', 'Glenn Curtiss', 'Alberto Santos-Dumont'],
  ['Who invented pasteurization?', 'Louis Pasteur', 'Robert Koch', 'Alexander Fleming', 'Joseph Lister'],
];

for (const [question, c, w1, w2, w3] of inventorFacts) {
  generated.push(q(question, 'history', c, [w1, w2, w3]));
}

// --- Mythology ---
const mythFacts = [
  ['Who is the king of the gods in Greek mythology?', 'Zeus', 'Poseidon', 'Hades', 'Apollo'],
  ['Who is the goddess of wisdom in Greek mythology?', 'Athena', 'Hera', 'Aphrodite', 'Artemis'],
  ['What is the name of Thor\'s hammer in Norse mythology?', 'Mjolnir', 'Gungnir', 'Gram', 'Durendal'],
  ['Who stole fire from the gods in Greek myth?', 'Prometheus', 'Hercules', 'Perseus', 'Odysseus'],
  ['In Greek myth, who opened a box releasing troubles?', 'Pandora', 'Helen', 'Medusa', 'Cassandra'],
  ['Who is the Roman equivalent of Zeus?', 'Jupiter', 'Mars', 'Neptune', 'Saturn'],
  ['What creature has snakes for hair?', 'Medusa', 'Harpy', 'Siren', 'Chimera'],
  ['What is Achilles\' famous weak spot?', 'Heel', 'Knee', 'Shoulder', 'Back'],
  ['Who is the Norse god of thunder?', 'Thor', 'Odin', 'Loki', 'Freyja'],
  ['What is the underworld river in Greek myth?', 'Styx', 'Nile', 'Lethe', 'Acheron'],
];

for (const [question, c, w1, w2, w3] of mythFacts) {
  generated.push(q(question, 'culture', c, [w1, w2, w3]));
}

// --- More sports ---
const sports2 = [
  ['What is the maximum score in ten-pin bowling in one game?', '300', '200', '250', '100'],
  ['In volleyball, how many hits per side is typical before returning?', '3', '2', '4', '5'],
  ['What country hosted the 2016 Summer Olympics?', 'Brazil', 'UK', 'China', 'Japan'],
  ['What is the national sport of Japan (martial art)?', 'Sumo', 'Karate', 'Judo', 'Kendo'],
  ['How many players on a rugby union team on the field?', '15', '13', '11', '12'],
  ['What is the distance of a marathon in kilometers (approx)?', '42.2 km', '40 km', '50 km', '35 km'],
  ['In which sport might you do an ollie?', 'Skateboarding', 'Skiing', 'Surfing', 'Diving'],
  ['What is the term for zero in tennis?', 'Love', 'Deuce', 'Advantage', 'Ace'],
  ['What sport uses a shuttlecock?', 'Badminton', 'Tennis', 'Squash', 'Racquetball'],
  ['What is the name of the NFL championship game?', 'Super Bowl', 'World Series', 'Stanley Cup', 'NBA Finals'],
];

for (const [question, c, w1, w2, w3] of sports2) {
  generated.push(q(question, 'sports', c, [w1, w2, w3]));
}

// --- Art & colors ---
const artFacts = [
  ['What are the primary colors of light (additive)?', 'Red, green, blue', 'Red, yellow, blue', 'Cyan, magenta, yellow', 'Black, white, gray'],
  ['Who cut off part of his own ear?', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dalí', 'Claude Monet'],
  ['What art movement is Salvador Dalí associated with?', 'Surrealism', 'Impressionism', 'Cubism', 'Baroque'],
  ['What is the art of paper folding called?', 'Origami', 'Kirigami', 'Ikebana', 'Sumi-e'],
  ['Who sculpted "David"?', 'Michelangelo', 'Donatello', 'Bernini', 'Rodin'],
  ['What museum is home to the Mona Lisa?', 'Louvre', 'British Museum', 'Met Museum', 'Uffizi'],
];

for (const [question, c, w1, w2, w3] of artFacts) {
  generated.push(q(question, 'art', c, [w1, w2, w3]));
}

// --- Health & body ---
const healthFacts = [
  ['How many chambers does a human heart have?', '4', '2', '3', '5'],
  ['What part of the brain controls balance?', 'Cerebellum', 'Cerebrum', 'Medulla', 'Hypothalamus'],
  ['What is the largest muscle in the human body?', 'Gluteus maximus', 'Biceps', 'Quadriceps', 'Deltoid'],
  ['What vitamin is produced in skin with sunlight?', 'Vitamin D', 'Vitamin C', 'Vitamin K', 'Vitamin E'],
  ['What carries oxygen in red blood cells?', 'Hemoglobin', 'Plasma', 'Platelets', 'White blood cells'],
];

for (const [question, c, w1, w2, w3] of healthFacts) {
  generated.push(q(question, 'science', c, [w1, w2, w3]));
}

// --- US civics & misc ---
const usFacts = [
  ['How many amendments are in the US Bill of Rights (first ten)?', '10', '12', '8', '15'],
  ['How many US Supreme Court justices are there (traditional number)?', '9', '7', '11', '12'],
  ['What is the first US state alphabetically?', 'Alabama', 'Alaska', 'Arizona', 'Arkansas'],
  ['What is the last US state alphabetically?', 'Wyoming', 'Wisconsin', 'Washington', 'West Virginia'],
  ['Who is on the US $1 bill?', 'George Washington', 'Abraham Lincoln', 'Benjamin Franklin', 'Thomas Jefferson'],
];

for (const [question, c, w1, w2, w3] of usFacts) {
  generated.push(q(question, 'general', c, [w1, w2, w3]));
}

// --- More literature ---
const lit2 = [
  ['Who wrote "To Kill a Mockingbird"?', 'Harper Lee', 'Truman Capote', 'John Steinbeck', 'William Faulkner'],
  ['Who wrote "Frankenstein"?', 'Mary Shelley', 'Bram Stoker', 'Edgar Allan Poe', 'H.P. Lovecraft'],
  ['Who wrote "The Odyssey"?', 'Homer', 'Virgil', 'Sophocles', 'Euripides'],
  ['What is the name of Sherlock Holmes\' friend?', 'Dr. Watson', 'Dr. Moriarty', 'Lestrade', 'Hudson'],
  ['Who wrote "Crime and Punishment"?', 'Fyodor Dostoevsky', 'Leo Tolstoy', 'Anton Chekhov', 'Ivan Turgenev'],
];

for (const [question, c, w1, w2, w3] of lit2) {
  generated.push(q(question, 'literature', c, [w1, w2, w3]));
}

// --- Chemistry & physics extra ---
const chemFacts = [
  ['What is the atomic number of carbon?', '6', '8', '12', '14'],
  ['What is the chemical symbol for sodium?', 'Na', 'S', 'So', 'Sd'],
  ['What gas do humans exhale more of than they inhale?', 'Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'],
  ['What particle has a positive charge in an atomic nucleus?', 'Proton', 'Electron', 'Neutron', 'Photon'],
  ['What particle has a negative charge?', 'Electron', 'Proton', 'Neutron', 'Photon'],
];

for (const [question, c, w1, w2, w3] of chemFacts) {
  generated.push(q(question, 'science', c, [w1, w2, w3]));
}

// --- Merge ---
const prompts = JSON.parse(readFileSync(PROMPTS, 'utf8'));
const existing = prompts.trivia || [];
const seen = new Set(existing.map((e) => e.question.trim().toLowerCase()));
const merged = [...existing];
let added = 0;
for (const item of generated) {
  const key = item.question.trim().toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  merged.push(item);
  added++;
}

prompts.trivia = merged;
writeFileSync(PROMPTS, JSON.stringify(prompts, null, 2) + '\n', 'utf8');
console.log(
  JSON.stringify(
    {
      previousCount: existing.length,
      generatedPool: generated.length,
      addedNew: added,
      totalNow: merged.length,
    },
    null,
    2
  )
);
