// MOM's Public Education Program: easy open-ended prompts (re-exported by
// misinformation_question_bank.mjs, the canonical bank). Answers are
// "name=alias,alias". Tier 0 (10 pts) lists the obvious answers; tiers 1-5 earn
// 15/30/60/85/100. These are ordinary nouns, not claims to grade.
const P = (id, prompt, common, ...rare) => ({id, prompt, tiers: [common, ...rare].map(t => t.split('|').filter(Boolean))});
export const simplePrompts = [
 P('color','Name a color.','red|blue|green|yellow|orange|purple=violet|pink|black|white|brown|gray=grey|gold=golden','teal=turquoise|indigo','magenta|maroon','vermilion|chartreuse','periwinkle','ultramarine'),
 P('animal','Name an animal.','dog=puppy|cat=kitten|cow|horse|pig|sheep|chicken|duck|lion|elephant|monkey|bear','giraffe|zebra','platypus|otter','axolotl|pangolin','okapi','tardigrade'),
 P('food','Name a food.','pizza|bread|rice|apple=apples|cheese|pasta=spaghetti|egg=eggs|chicken|burger=hamburger|cake|soup|salad','taco=tacos|noodles','dumpling=dumplings|sushi','paella|falafel','kimchi','jollof rice'),
 P('flies','Name a thing that flies.','bird=birds|airplane=plane,aeroplane,jet|helicopter|kite|bee|butterfly|eagle|balloon=hot air balloon|rocket|drone|fly|superman','bat=bats|owl','glider|dragonfly','zeppelin=blimp,airship','pterodactyl=pterosaur','flying squirrel'),
 P('desk','Name something on a desk.','pen|pencil|paper|computer=laptop|lamp|stapler|notebook|mouse|keyboard|phone|mug=coffee cup,cup|calendar','tape|paperclip=paper clips','highlighter|monitor=screen','rolodex','inkwell','newtons cradle'),
 P('fruit','Name a fruit.','apple|banana|orange|grape=grapes|strawberry|lemon|pear|peach|watermelon|cherry|pineapple|mango','kiwi|plum','papaya|lychee','dragon fruit','persimmon','rambutan'),
 P('drink','Name a drink.','water|milk|juice=orange juice,apple juice|soda=cola,coke,pop|tea|coffee|lemonade|smoothie|beer|wine|hot chocolate=cocoa|milkshake','kombucha|cider','espresso=latte,cappuccino','sake|horchata','kefir','yerba mate=mate'),
 P('vehicle','Name a vehicle.','car|bus|truck|train|bicycle=bike|motorcycle|boat=ship|airplane=plane|helicopter|taxi=cab|van|scooter','tractor|subway=metro','ambulance|submarine','tram=streetcar','hovercraft','rickshaw=tuk tuk'),
 P('clothing','Name something you wear.','shirt=t-shirt|pants=trousers,jeans|socks|shoes=sneakers|hat=cap|jacket=coat|dress|skirt|gloves|scarf|shorts|sweater=jumper,hoodie','belt|boots','tie=necktie|apron','kimono|poncho','cummerbund','fez'),
 P('shape','Name a shape.','circle|square|triangle|rectangle|oval|star|heart|diamond|cube|sphere|cone|cylinder','pentagon|hexagon','octagon|crescent','trapezoid=trapezium','rhombus','dodecahedron'),
 P('body','Name a part of the body.','head|arm|leg|hand|foot=feet|eye=eyes|ear=ears|nose|mouth|finger=fingers|knee|stomach=belly','elbow|shoulder','ankle|wrist','spleen|femur','clavicle=collarbone','sternum'),
 P('instrument','Name a musical instrument.','guitar|piano|drums=drum|violin|trumpet|flute|saxophone|cello|harp|bass|trombone|clarinet','ukulele|banjo','accordion|harmonica','oboe|bagpipes','theremin','sitar'),
 P('sport','Name a sport.','soccer=football|basketball|baseball|tennis|golf|swimming|hockey|volleyball|rugby|boxing|cricket|running=track','badminton|archery','fencing|rowing','curling|lacrosse','pickleball','sepak takraw'),
 P('kitchen','Name something in a kitchen.','fridge=refrigerator|stove=oven,cooker|sink|spoon|fork|knife|plate|bowl|pan=frying pan|pot|microwave|toaster','kettle|blender','whisk|colander=strainer','spatula|ladle','mandoline','garlic press'),
 P('room','Name a room in a house.','kitchen|bedroom|bathroom=toilet|living room=lounge|garage|attic|basement=cellar|dining room|hallway=hall|office|laundry room|closet','porch|nursery','pantry|study','foyer|den','mudroom','scullery'),
 P('job','Name a job.','teacher|doctor|nurse|farmer|pilot|chef=cook|police officer=policeman,cop|firefighter=fireman|driver|builder|artist|singer','plumber|electrician','librarian|dentist','astronomer|blacksmith','sommelier','cartographer'),
 P('toy','Name a toy.','ball|doll|teddy bear=teddy|lego=legos,building blocks|puzzle|yo-yo|robot|train set|blocks|toy car|drum|spinning top=top','slinky|marbles','jack-in-the-box|rubiks cube','etch a sketch','jacks','diabolo'),
 P('weather','Name a kind of weather.','rain|snow|sun=sunny|wind=windy|cloud=cloudy|storm|fog=foggy|thunder|lightning|hail|ice|heat wave=hot','drizzle|sleet','tornado=twister|blizzard','monsoon|squall','haboob','virga'),
 P('plant','Name a plant or tree.','oak|pine|maple|palm=palm tree|rose|tulip|daisy|sunflower|grass|cactus|fern|bamboo','willow|birch','orchid|redwood=sequoia','baobab|venus flytrap','welwitschia','ginkgo'),
 P('school','Name a school subject.','math=maths,mathematics|english|science|history|art|music|geography|gym=pe,physical education|reading|writing|biology|chemistry','physics|spanish','drama|economics','latin|philosophy','etymology','rhetoric'),
 P('pet','Name a pet.','dog|cat|goldfish=fish|hamster|rabbit=bunny|parakeet=budgie,bird|turtle|snake|guinea pig|lizard|horse|parrot','ferret|mouse','hedgehog|gecko','chinchilla|tarantula','axolotl','sugar glider'),
 P('tool','Name a tool.','hammer|screwdriver|saw|drill|wrench=spanner|pliers|shovel|axe|ruler|tape measure|level|scissors','chisel|crowbar','hacksaw|sander','awl|plane','adze','mattock'),
 P('bathroom','Name something in a bathroom.','toilet|sink|shower|bathtub=bath,tub|towel|soap|toothbrush|toothpaste|mirror|shampoo|toilet paper|comb','plunger|razor','loofah|scale','bidet','pumice stone','bath bomb'),
 P('bag','Name something in a school bag.','book|pencil|pen|notebook|eraser=rubber|ruler|lunchbox=lunch|calculator|folder|crayon|glue|scissors','compass|stapler','protractor|highlighter','slide rule','abacus','quill'),
 P('holiday','Name a holiday or celebration.','christmas|halloween|easter|birthday|thanksgiving|new year=new years|valentines day|wedding|independence day|hanukkah|diwali|ramadan','eid|carnival','kwanzaa|mardi gras','holi|lunar new year=chinese new year','oktoberfest','groundhog day'),
 P('bird','Name a bird.','robin|eagle|owl|duck|chicken|parrot|crow|pigeon|sparrow|penguin|swan|seagull=gull','hawk|flamingo','toucan|peacock','kiwi|hummingbird','kakapo','cassowary'),
 P('country','Name a country.','america=usa,united states,us|canada|mexico|france|england=uk,united kingdom,britain|germany|italy|spain|china|japan|india|brazil','egypt|australia','peru|norway','bhutan|mongolia','tuvalu','eswatini=swaziland'),
 P('office','Name something in an office.','desk|chair|computer|printer|phone|stapler|whiteboard|meeting=meetings|copier=photocopier|pen|cubicle|coffee','fax machine=fax|shredder','water cooler|lanyard','memo','org chart','synergy'),
];
