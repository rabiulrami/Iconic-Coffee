export interface MenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  descriptionEn?: string;
  descriptionAr?: string;
  category: string;
  tag?: string; // 'TODAY\'S PICK' | 'FAN FAVORITE' | 'CHEF\'S SPECIAL' etc.
  bgColor?: string; // custom gradient or background colors for premium look
  isSpecial?: boolean;
  image?: string;
}

export const CATEGORIES = [
  { id: 'specials', nameEn: 'Specials', nameAr: 'المميزة', icon: 'Sparkles' },
  { id: 'sweet', nameEn: 'Sweet', nameAr: 'حلويات', icon: 'CakeSlice' },
  { id: 'boba', nameEn: 'Boba Drinks', nameAr: 'بوبا', icon: 'Milk' },
  { id: 'cold', nameEn: 'Cold Drinks', nameAr: 'مشروبات باردة', icon: 'CupSoda' },
  { id: 'matcha', nameEn: 'Matcha & Shake', nameAr: 'ماتشا وميلك شيك', icon: 'IceCream' },
  { id: 'juice', nameEn: 'Juice', nameAr: 'عصير', icon: 'Citrus' },
  { id: 'hot', nameEn: 'Hot Drinks', nameAr: 'مشروبات ساخنة', icon: 'Coffee' },
];

export const MENU_ITEMS: MenuItem[] = [
  // specials
  {
    id: 'spec-1',
    nameEn: 'PISTACHIO ROSE LATTE',
    nameAr: 'لاتيه الفستق والورد',
    price: 22,
    descriptionEn: 'Espresso, pistachio cream, rose water, steamed milk.',
    descriptionAr: 'اسبريسو، كريمة الفستق، ماء ورد، وحليب مبخر غني.',
    category: 'specials',
    tag: 'TODAY\'S PICK',
    isSpecial: true,
    bgColor: 'from-amber-100 to-emerald-50',
    image: 'pistachio_rose'
  },
  {
    id: 'spec-2',
    nameEn: 'BROWN SUGAR FRAPPE',
    nameAr: 'فرابيه سكر بني',
    price: 20,
    descriptionEn: 'Brown sugar syrup, espresso, milk, blended ice, cream.',
    descriptionAr: 'شراب السكر البني، اسبريسو، حليب، ثلج مخفوق، وكريمة.',
    category: 'specials',
    tag: 'FAN FAVORITE',
    isSpecial: true,
    bgColor: 'from-amber-100 to-amber-200',
    image: 'brown_sugar'
  },
  {
    id: 'spec-3',
    nameEn: 'SAFFRON HONEY LATTE',
    nameAr: 'لاتيه الزعفران والعسل',
    price: 24,
    descriptionEn: 'Espresso, saffron infused honey, milk, cardamom, steamed milk.',
    descriptionAr: 'اسبريسو، عسل بنكهة الزعفران والهل، وحليب مبخر.',
    category: 'specials',
    tag: 'CHEF\'S SPECIAL',
    isSpecial: true,
    bgColor: 'from-amber-50 to-orange-100',
    image: 'saffron_honey'
  },

  // Sweet
  {
    id: 'sweet-1',
    nameEn: 'KHALAT AL NAHL',
    nameAr: 'خلية النحل',
    price: 25,
    descriptionEn: 'Fresh pastry layers soaked with natural honey and cream.',
    descriptionAr: 'عجينة خلية النحل الطازجة بجبنة الكيري والعسل الطبيعي والسمسم.',
    category: 'sweet',
    image: 'khalat'
  },
  {
    id: 'sweet-2',
    nameEn: 'SAN SEBASTIAN',
    nameAr: 'سان سيباستيان',
    price: 23,
    descriptionEn: 'Rich, crustless burnt Basque cheesecake made with premium cream cheese.',
    descriptionAr: 'كيكة سان سيباستيان الغنية والمخبوزة بطبقة كراميل محروقة مميزة.',
    category: 'sweet',
    image: 'san_seb'
  },
  {
    id: 'sweet-3',
    nameEn: 'LOTUS CHEESECAKE',
    nameAr: 'تشيز كيك لوتس',
    price: 22,
    descriptionEn: 'Creamy cheesecake on a buttery Biscoff crust, topped with cookie butter spread.',
    descriptionAr: 'تشيز كيك اللوتس الكريمية بطبقة من بسكويت لوتس الشهير.',
    category: 'sweet',
    image: 'lotus_cheese'
  },
  {
    id: 'sweet-4',
    nameEn: 'BLUEBERRY CHEESECAKE',
    nameAr: 'تشيز كيك التوت الأزرق',
    price: 22,
    descriptionEn: 'Classic creamy baked cheesecake topped with thick, sweet blueberry coulis.',
    descriptionAr: 'تشيز كيك بنكهة التوت الأزرق اللذيذة والمنعشة طبقات فاخرة.',
    category: 'sweet',
    image: 'blue_cheese'
  },
  {
    id: 'sweet-5',
    nameEn: 'HONEY CAKE',
    nameAr: 'كيكة العسل',
    price: 22,
    descriptionEn: 'Multi-layered Soviet honey cake with sweet, tangy sour cream frosting.',
    descriptionAr: 'كيكة العسل الروسية التقليدية بطبقات متناغمة وكريمة هشة.',
    category: 'sweet',
    image: 'honey_cake'
  },
  {
    id: 'sweet-6',
    nameEn: 'SAFFRON CAKE',
    nameAr: 'كيكة الزعفران',
    price: 23,
    descriptionEn: 'Delectfully moist sponge cake infused with warm saffron, served with saffron milk.',
    descriptionAr: 'كيكة الإسفنجية المنقوعة بحليب الزعفران الفاخر غنية بالنكهة.',
    category: 'sweet',
    image: 'saffron_cake'
  },
  {
    id: 'sweet-7',
    nameEn: 'COOKIES',
    nameAr: 'كوكيز',
    price: 10,
    descriptionEn: 'Freshly baked cookie with gooey chocolate chips inside.',
    descriptionAr: 'كوكيز كلاسيكي طازج بقطع الشوكولاتة الذائبة واللذيذة.',
    category: 'sweet',
    image: 'cookie'
  },
  {
    id: 'sweet-8',
    nameEn: 'SAJ COOKIES',
    nameAr: 'سج كوكيز',
    price: 20,
    descriptionEn: 'Unique thin, crispy flat-grilled big cookie served with a signature chocolate sauce.',
    descriptionAr: 'كوكيز الصاج المقرمش والفريد يقدم ساخناً مع صوص الشوكولاتة.',
    category: 'sweet',
    image: 'saj_cookie'
  },
  {
    id: 'sweet-9',
    nameEn: 'BROWNIES',
    nameAr: 'براونيز',
    price: 15,
    descriptionEn: 'Fudgy, dense triple chocolate brownie block.',
    descriptionAr: 'قطع البراونيز الغنية بالشوكولاتة والمخبوزة بقوام كريمي داخلي.',
    category: 'sweet',
    image: 'brownies'
  },
  {
    id: 'sweet-10',
    nameEn: 'BROWNIES & ICE CREAM',
    nameAr: 'براونيز مع آيس كريم',
    price: 20,
    descriptionEn: 'Warm homemade chocolate brownie topped with cold premium vanilla ice cream.',
    descriptionAr: 'براونيز دافئ ولذيذ يقدم مباشرة مع بولة آيس كريم فانيليا باردة.',
    category: 'sweet',
    image: 'brownies_ice'
  },
  {
    id: 'sweet-11',
    nameEn: 'MINI PANCAKES',
    nameAr: 'ميني بان كيك',
    price: 20,
    descriptionEn: '10 pieces of bite-sized mini pancakes with your choice of warm chocolate toppings.',
    descriptionAr: '١٠ قطع ميني بان كيك صغيرة وخفيفة بدانتيل الشوكولاتة من اختيارك.',
    category: 'sweet',
    image: 'mini_pancake'
  },
  {
    id: 'sweet-12',
    nameEn: 'NUTELLA CREPE',
    nameAr: 'كريب نوتيلا',
    price: 20,
    descriptionEn: 'Freshly folded thin French crepe smothered with rich Nutella chocolate hazelnut spread.',
    descriptionAr: 'كريب رقيق ومميز مغطى بالكامل بشوكولاتة نوتيلا اللذيذة.',
    category: 'sweet',
    image: 'nutella_crepe'
  },
  {
    id: 'sweet-13',
    nameEn: 'LOTUS CREPE',
    nameAr: 'كريب لوتس',
    price: 20,
    descriptionEn: 'Griddle fresh crepe filled and drizzled with smooth Biscoff cookie spread.',
    descriptionAr: 'كريب طازج ومقرمش مغمور بصوص زبدة وبسكويت اللوتس الرهيبة.',
    category: 'sweet',
    image: 'lotus_crepe'
  },
  {
    id: 'sweet-14',
    nameEn: 'PISTACHIO CREPE',
    nameAr: 'كريب بستاشيو',
    price: 23,
    descriptionEn: 'Crepe folded and loaded with aromatic Mediterranean pistachio sauce.',
    descriptionAr: 'كريب غني ومزين بصوص الفستق الفاخر ذو النكهة الطبيعية.',
    category: 'sweet',
    image: 'pistachio_crepe'
  },
  {
    id: 'sweet-15',
    nameEn: 'OREO CREPE',
    nameAr: 'كريب أوريو',
    price: 22,
    descriptionEn: 'Fresh crepe sprinkled with crushed Oreo pieces and rich fudge chocolate sauce.',
    descriptionAr: 'كريب مزين بقطع بسكويت أوريو المطحون الشهي مع صوص الشوكولاتة.',
    category: 'sweet',
    image: 'oreo_crepe'
  },
  {
    id: 'sweet-16',
    nameEn: 'FETTUCCINE CREPE',
    nameAr: 'فيتوتشيني كريب',
    price: 23,
    descriptionEn: 'Crepe ribbon-cut to simulate pasta noodles, loaded with premium milk and white chocolates.',
    descriptionAr: 'كريب مقطع كشرائح باستا فيتوتشيني غنية بالشوكولاتة الثلاثية.',
    category: 'sweet',
    image: 'fett_crepe'
  },
  {
    id: 'sweet-17',
    nameEn: 'KINDER WAFFLE',
    nameAr: 'وافل كيندر',
    price: 24,
    descriptionEn: 'Crispy golden grid waffle served with authentic warm Kinder chocolate dressing.',
    descriptionAr: 'وافل ذهبي مقرمش من الخارج مغطى بصوص شوكولاتة كيندر الساحر.',
    category: 'sweet',
    image: 'kinder_waffle'
  },
  {
    id: 'sweet-18',
    nameEn: 'FRUIT WAFFLE',
    nameAr: 'وافل بالفواكه',
    price: 25,
    descriptionEn: 'Fluffy waffle with sliced fresh strawberries, banana, and premium sweet drizzles.',
    descriptionAr: 'وافل دافئ يقدم مع الفواكه الطازجة مثل الفراولة والموز وصوص العسل أو الشوكولاتة.',
    category: 'sweet',
    image: 'fruit_waffle'
  },
  {
    id: 'sweet-19',
    nameEn: 'WAFFLE MIX',
    nameAr: 'وافل ميكس',
    price: 25,
    descriptionEn: 'Your choice of mixed toppings of pistachio, lotus, and chocolate sauces.',
    descriptionAr: 'وافل ميكس يجمع صوصات متعددة بين اللوتس والشوكولاتة والفستق حسب رغبتك.',
    category: 'sweet',
    image: 'waffle_mix'
  },
  {
    id: 'sweet-20',
    nameEn: 'PUDDING',
    nameAr: 'بودينج',
    price: 23,
    descriptionEn: 'Rich, smooth custard dessert pudding with chocolate toppings.',
    descriptionAr: 'بودينج كريمي دافئ غني بصوص الشوكولاتة الداكنة أو الحليب.',
    category: 'sweet',
    image: 'pudding'
  },
  {
    id: 'sweet-21',
    nameEn: 'ICED PISTACHIO LATTE (SWEET)',
    nameAr: 'آيس بستاشيو لاتيه',
    price: 24,
    descriptionEn: 'Sweet, creamy iced latte infused with natural double-filtered pistachio sauce.',
    descriptionAr: 'آيس لاتيه غني ومحلى محضر من كريمة الفستق الطبيعي والثلج وحليب طازج.',
    category: 'sweet',
    image: 'iced_pistachio_s'
  },

  // Boba Drinks
  {
    id: 'boba-1',
    nameEn: 'SIGNATURE BROWN SUGAR BOBA',
    nameAr: 'بوبا سكر بني إسجنتشر',
    price: 20,
    descriptionEn: 'Classic caramelized brown sugar caramelized tapioca boba with rich milk cream.',
    descriptionAr: 'بوبا السكر البني الإسجنتشر مع طبقة غنية وحليب طازج ولؤلؤ التابيوكا.',
    category: 'boba',
    image: 'sugar_boba'
  },
  {
    id: 'boba-2',
    nameEn: 'MILK TEA BOBA',
    nameAr: 'شاي الحليب بوبا',
    price: 22,
    descriptionEn: 'Robust black tea base with organic sweetened creamy milk and bouncy boba pearls.',
    descriptionAr: 'شاي الحليب بوبا الكلاسيكي المنعش والبارد بكرات التابيوكا اللذيذة.',
    category: 'boba',
    image: 'milk_tea_boba'
  },
  {
    id: 'boba-3',
    nameEn: 'TARO MILK TEA',
    nameAr: 'شاي حليب التارو',
    price: 22,
    descriptionEn: 'Sweet, nutty purple taro root milk tea with fresh tapioca pearls.',
    descriptionAr: 'شاي حليب التارو البنفسجي الشهير بطعمه الكريمي الغني وحبات البوبا.',
    category: 'boba',
    image: 'taro_boba'
  },
  {
    id: 'boba-4',
    nameEn: 'MATCHA BOBA',
    nameAr: 'ماتشا بوبا',
    price: 22,
    descriptionEn: 'Finely whisked premium Japanese green matcha tea layer with sweet cold milk & boba.',
    descriptionAr: 'شاي الماتشا الياباني الأخضر مع الحليب البارد وحبيبات البوبا العضوية.',
    category: 'boba',
    image: 'matcha_boba'
  },
  {
    id: 'boba-5',
    nameEn: 'CHOCOLATE CHIP BOBA',
    nameAr: 'بوبا رقائق الشوكولاتة',
    price: 22,
    descriptionEn: 'Intense double chocolate shake with dark chocolate chips and boba pearls.',
    descriptionAr: 'بوبا رقائق الشوكولاتة بنكهة غنية مضاعفة تناسب عشاق الكاكاو الفخم.',
    category: 'boba',
    image: 'choc_boba'
  },
  {
    id: 'boba-6',
    nameEn: 'MOCHA PEARL FRAPPE',
    nameAr: 'موكا بيرل فرابيه',
    price: 23,
    descriptionEn: 'Creamy blended chocolate and espresso frappe with soft, chewy tapioca pearls.',
    descriptionAr: 'موكا فرابيه المثلجة والمخفوقة بقطع الشوكولاتة تقدم مع لؤلؤ البوبا البارد.',
    category: 'boba',
    image: 'mocha_frappe_boba'
  },
  {
    id: 'boba-7',
    nameEn: 'OREO BOBA',
    nameAr: 'أوريو بوبا',
    price: 22,
    descriptionEn: 'Sweet cookies and cream milk tea loaded with crunch and delicious tapioca boba.',
    descriptionAr: 'حليب الأوريو الكثيف الممزوج بالبسكويت المهروس واللؤلؤ المميز.',
    category: 'boba',
    image: 'oreo_boba'
  },
  {
    id: 'boba-8',
    nameEn: 'STRAWBERRY BOBA',
    nameAr: 'فراولة بوبا',
    price: 22,
    descriptionEn: 'Vibrant house-made real strawberry puree, sweet whole cold milk, and pearls.',
    descriptionAr: 'بوبا الفراولة الطازجة المحضرة بهريس الفراولة المنعشة والحليب والثلج.',
    category: 'boba',
    image: 'straw_boba'
  },
  {
    id: 'boba-9',
    nameEn: 'COCONUT BOBA',
    nameAr: 'جوز الهند بوبا',
    price: 20,
    descriptionEn: 'Tropical coconut cream sweet milk tea with chewy black sugar boba pearls.',
    descriptionAr: 'بوبا جوز الهند المنعشة بنكهتها الاستوائية الفريدة وحبيبات التابيوكا دافئة.',
    category: 'boba',
    image: 'coconut_boba'
  },
  {
    id: 'boba-10',
    nameEn: 'ICED LATTE BOBA',
    nameAr: 'آيس لاتيه بوبا',
    price: 23,
    descriptionEn: 'Premium bold espresso shot extracted directly onto cold sweet milk and boba.',
    descriptionAr: 'آيس لاتيه بوبا يدمج مرارة الإسبريسو الفاخر مع حلاوة حب بوبا التابيوكا.',
    category: 'boba',
    image: 'iced_latte_boba'
  },
  {
    id: 'boba-11',
    nameEn: 'PISTACHIO BOBA',
    nameAr: 'فستق بوبا',
    price: 23,
    descriptionEn: 'Double shot pistachio milk rich fusion drink with classic chewy boba.',
    descriptionAr: 'مشروب بوبا الفستق اللذيذ لخلطة كريمية ناعمة غنية بالفستق الحلبي.',
    category: 'boba',
    image: 'pist_boba'
  },
  {
    id: 'boba-12',
    nameEn: 'CARAMEL LATTE BOBA',
    nameAr: 'كراميل لاتيه بوبا',
    price: 23,
    descriptionEn: 'Creamy caramel drippings, cold milk, rich espresso, and sweet boba pearls.',
    descriptionAr: 'كراميل لاتيه بوبا الغني بصوص الكراميل المحلى وحبوب البوبا الشهية.',
    category: 'boba',
    image: 'caramel_boba'
  },
  {
    id: 'boba-13',
    nameEn: 'MANGO BOBA',
    nameAr: 'مانجو بوبا',
    price: 22,
    descriptionEn: 'Real mango pulp puree with creamy cold milk and loaded sweetened boba pearls.',
    descriptionAr: 'بوبا المانجو الحلوة بهريس المانجو الطبيعي البارد لرحلة استوائية طازجة.',
    category: 'boba',
    image: 'mango_boba'
  },
  {
    id: 'boba-14',
    nameEn: 'ICED SPANISH LATTE BOBA',
    nameAr: 'آيس سبانش لاتيه بوبا',
    price: 23,
    descriptionEn: 'Sweet condensed milk, premium espresso, cold milk with loads of sweet boba.',
    descriptionAr: 'آيس سبانش لاتيه بوبا الخيار الأفضل لعشاق الحلاوة والإسبريسو الثقيل.',
    category: 'boba',
    image: 'spanish_boba'
  },

  // Cold Drinks
  {
    id: 'cold-1',
    nameEn: 'ICED LATTE',
    nameAr: 'آيس لاتيه',
    price: 14,
    descriptionEn: 'Chilled milk poured over rich espresso shots and iced to perfection.',
    descriptionAr: 'إسبريسو قوي مع الحليب البارد والثلج لمذاق متوازن ومنعش.',
    category: 'cold',
    image: 'iced_latte'
  },
  {
    id: 'cold-2',
    nameEn: 'ICED SPANISH LATTE',
    nameAr: 'آيس سبانش لاتيه',
    price: 17,
    descriptionEn: 'Sweet condensed milk balanced perfectly with heavy double shot espresso, milk, and ice.',
    descriptionAr: 'آيس سبانش لاتيه المحلى والمحضر باحتراف يناسب ذوقك الراقي.',
    category: 'cold',
    image: 'iced_spanish'
  },
  {
    id: 'cold-3',
    nameEn: 'ICED PISTACHIO LATTE',
    nameAr: 'آيس بستاشيو لاتيه',
    price: 18,
    descriptionEn: 'Distinct roasted pistachio flavor, ice cold milk, and organic espresso shots.',
    descriptionAr: 'نكهة الفستق المحمص الغنية مدمجة مع إسبريسو وحليب مثلج.',
    category: 'cold',
    image: 'iced_pist_c'
  },
  {
    id: 'cold-4',
    nameEn: 'ICED CARAMEL MACCHIATO',
    nameAr: 'آيس كراميل ماكياتو',
    price: 17,
    descriptionEn: 'Vanilla syrup, cold milk, layered espresso, topped with rich buttery caramel grid.',
    descriptionAr: 'كراميل ماكياتو المثلج بطبقة الكراميل الفاخرة وخلاصة الفانيلا.',
    category: 'cold',
    image: 'iced_car_mac'
  },
  {
    id: 'cold-5',
    nameEn: 'ICED WHITE MOCHA',
    nameAr: 'آيس وايت موكا',
    price: 20,
    descriptionEn: 'Sweet white chocolate, bold reserve espresso, fresh cold milk, served over ice.',
    descriptionAr: 'مزيج رائع من الشوكولاتة البيضاء الحلوة والحليب والإسبريسو البارد.',
    category: 'cold',
    image: 'iced_w_mocha'
  },
  {
    id: 'cold-6',
    nameEn: 'ICED CHOCOLATE',
    nameAr: 'شوكولاتة باردة',
    price: 19,
    descriptionEn: 'Creamy cocoa blend with premium milk, vanilla hints, iced to perfection.',
    descriptionAr: 'شوكولاتة باردة وكريمية غنية بالكاكاو وحليب طازج ولذيذ للترطيب.',
    category: 'cold',
    image: 'iced_chocolate'
  },
  {
    id: 'cold-7',
    nameEn: 'MOCHA FRAPPE',
    nameAr: 'موكا فرابيه',
    price: 19,
    descriptionEn: 'Blended beverage combining chocolate chips, rich mocha coffee, milk, whipped cream.',
    descriptionAr: 'موكا فرابيه غنيه بالثلج المجروش والشوكولاتة والقهوة الفاخرة والكاكاو.',
    category: 'cold',
    image: 'mocha_frappe'
  },
  {
    id: 'cold-8',
    nameEn: 'HIBISCUS TEA',
    nameAr: 'شاي كركديه',
    price: 10,
    descriptionEn: 'Sweet, tart, iced deeply floral hibiscus flower loose iced tea.',
    descriptionAr: 'شاي الكركديه البارد والمنعش بمذاقه الحامض والحلو الطبيعي.',
    category: 'cold',
    image: 'hibiscus_tea'
  },
  {
    id: 'cold-9',
    nameEn: 'ICED AMERICANO',
    nameAr: 'آيس أمريكانو',
    price: 13,
    descriptionEn: 'Pure espresso extracts diluted with chilled water and poured over solid ice blocks.',
    descriptionAr: 'لقطات من الإسبريسو الفخم مخفف بالماء البارد والثلج الصافي.',
    category: 'cold',
    image: 'iced_americano'
  },
  {
    id: 'cold-10',
    nameEn: 'FRAPPUCCINO',
    nameAr: 'فرابيتشينو',
    price: 17,
    descriptionEn: 'Sweet, highly blended standard cold coffee frappe base with light syrup.',
    descriptionAr: 'فرابيتشينو مثلج ومخفوق بعناية لعشاق القهوة الباردة والبهيجة.',
    category: 'cold',
    image: 'frappuccino'
  },
  {
    id: 'cold-11',
    nameEn: 'SALTED CARAMEL LATTE',
    nameAr: 'سوليتد كراميل لاتيه',
    price: 18,
    descriptionEn: 'Chilled whole milk, double espresso, sweetened with sweet and salty caramel drizzle.',
    descriptionAr: 'سوليتد كراميل لاتيه البارد بمزيج الكراميل المالح الرائع والقهوة.',
    category: 'cold',
    image: 'salted_caramel'
  },
  {
    id: 'cold-12',
    nameEn: 'ICE SHAKEN',
    nameAr: 'آيس شيكن',
    price: 17,
    descriptionEn: 'Bold espresso vigorously shaken with sweet classic syrup, ice, and dynamic frothing.',
    descriptionAr: 'إسبريسو مخفوق بقوة مع الجليد والشراب لطبقة رغوية كثيفة ومثالية.',
    category: 'cold',
    image: 'ice_shaken'
  },
  {
    id: 'cold-13',
    nameEn: 'V60 COLD',
    nameAr: 'V60 بارد',
    price: 16,
    descriptionEn: 'Premium drip filter iced method, bringing out high-acidity aromatic notes.',
    descriptionAr: 'قهوة مقطرة V60 باردة ومحضرة باحتراف لتذوق نوتات البن الحقيقية.',
    category: 'cold',
    image: 'v60_cold'
  },
  {
    id: 'cold-14',
    nameEn: 'WATER',
    nameAr: 'ماء',
    price: 2,
    descriptionEn: 'Pure clear premium local bottled drinking mineral water.',
    descriptionAr: 'مياه معدنية معبأة نقية ومنعشة وصحية لترطيب الجسم.',
    category: 'cold',
    image: 'water'
  },

  // Matcha & Milk Shake
  {
    id: 'msh-1',
    nameEn: 'STRAWBERRY MATCHA',
    nameAr: 'فراولة ماتشا',
    price: 20,
    descriptionEn: 'Earthy premium matcha layered over chilled sweet strawberry compote milk.',
    descriptionAr: 'ماتشا الفراولة المميزة بطعمها الترابي المبهج وهريس الفراولة.',
    category: 'matcha',
    image: 'straw_matcha'
  },
  {
    id: 'msh-2',
    nameEn: 'MANGO MATCHA',
    nameAr: 'مانجو ماتشا',
    price: 20,
    descriptionEn: 'Stone ground matcha green tea dynamic layer over exotic mango fruit milk.',
    descriptionAr: 'ماتشا المانجو الاستوائية الباردة بمذاق غير تقليدي فريد ومنعش.',
    category: 'matcha',
    image: 'mango_matcha'
  },
  {
    id: 'msh-3',
    nameEn: 'MATCHA LATTE',
    nameAr: 'ماتشا لاتيه',
    price: 20,
    descriptionEn: 'Pure high quality organic Japanese Uji matcha whisks layered with cold milk.',
    descriptionAr: 'شاي الماتشا الياباني الأصيل عالي الجودة مع الحليب البارد والثلج.',
    category: 'matcha',
    image: 'matcha_latte'
  },
  {
    id: 'msh-4',
    nameEn: 'MATCHA FRAPPE',
    nameAr: 'ماتشا فرابيه',
    price: 20,
    descriptionEn: 'Sweet blended ice matcha smoothie shake topped with smooth whipped cream.',
    descriptionAr: 'مخفوق الماتشا المثلج واللذيذ مغطى بطبقة مخملية من الكريمة الطازجة.',
    category: 'matcha',
    image: 'matcha_frappe'
  },
  {
    id: 'msh-5',
    nameEn: 'LOTUS MILK SHAKE',
    nameAr: 'ميلك شيك لوتس',
    price: 18,
    descriptionEn: 'Creamy cold vanilla shake blended with premium Lotus cookie butter.',
    descriptionAr: 'ميلك شيك غني بنكهة بسكويت زبدة اللوتس اللذيذة وقوام كثيف.',
    category: 'matcha',
    image: 'lotus_shake'
  },
  {
    id: 'msh-6',
    nameEn: 'NUTELLA MILK SHAKE',
    nameAr: 'ميلك شيك نوتيلا',
    price: 20,
    descriptionEn: 'Satisfying blended milk shake full of delicious premium Nutella chocolate cream.',
    descriptionAr: 'ميلك شيك نوتيلا الغني بالشخصية واللذيذ يعيد الحيوية ويسعد قلبك.',
    category: 'matcha',
    image: 'nutella_shake'
  },
  {
    id: 'msh-7',
    nameEn: 'OREO MILK SHAKE',
    nameAr: 'ميلك شيك أوريو',
    price: 18,
    descriptionEn: 'Vanilla ice cream and cold milk shake blended with crunchy Oreo cookies.',
    descriptionAr: 'ميلك شيك أوريو الكلاسيكي بالبسكويت المطحون ناعماً مع الحليب والآيس كريم.',
    category: 'matcha',
    image: 'oreo_shake'
  },
  {
    id: 'msh-8',
    nameEn: 'MANGO MILK SHAKE',
    nameAr: 'ميلك شيك مانجو',
    price: 18,
    descriptionEn: 'Sweet tropical cream shake blended with rich pieces of organic mango.',
    descriptionAr: 'ميلك شيك المانجو الذهبي الغني بطعم الكريمة وقطع المانجو الاستوائية.',
    category: 'matcha',
    image: 'mango_shake'
  },

  // Juice
  {
    id: 'juc-1',
    nameEn: 'STRAWBERRY BOBA JUICE',
    nameAr: 'فراولة بوبا عصير',
    price: 17,
    descriptionEn: 'Refreshing sweet strawberry clear fruit juice loaded with boba pearls.',
    descriptionAr: 'عصير الفراولة الطبيعي والمنعش مع لآلئ البوبا اللذيذة والباردة.',
    category: 'juice',
    image: 'straw_juice'
  },
  {
    id: 'juc-2',
    nameEn: 'PASSION FRUIT BOBA',
    nameAr: 'فاكهة العاطفة بوبا',
    price: 17,
    descriptionEn: 'Zesty exotic passiflora edulis yellow juice with premium boba seeds.',
    descriptionAr: 'عصير فاكهة الباشن فروت الحامضة اللذيذة المحسنة ببوبا التابيوكا.',
    category: 'juice',
    image: 'passion_boba'
  },
  {
    id: 'juc-3',
    nameEn: 'BLUEBERRY JUICE',
    nameAr: 'توت أزرق عصير',
    price: 14,
    descriptionEn: 'Deeply sweet, anti-oxidant rich fresh high bush blueberry extract chilled juice.',
    descriptionAr: 'عصير التوت الأزرق المنعش والغني بالفوائد طبيعي ومبرد للقصوى.',
    category: 'juice',
    image: 'blue_juice'
  },
  {
    id: 'juc-4',
    nameEn: 'MANGO SMOOTHIE',
    nameAr: 'سموذي المانجو',
    price: 15,
    descriptionEn: 'Smoothly blended 100% thick and frozen ripe sweet tropical pulped mango.',
    descriptionAr: 'سموذي المانجو الاستوائي الكثيف والمحضر طازجاً لترطيب رائع.',
    category: 'juice',
    image: 'mango_smoothie'
  },
  {
    id: 'juc-5',
    nameEn: 'BLUEBERRY FRAPPE (PREMIUM)',
    nameAr: 'فرابيه التوت الأزرق متميز',
    price: 15,
    descriptionEn: 'Rich, thick blended blueberry ice crush topped with delicious thick cream.',
    descriptionAr: 'فرابيه التوت الأزرق المتميز بالكريمة الغنية والثلج المجروش بنكهة قوية.',
    category: 'juice',
    image: 'blue_f_p'
  },
  {
    id: 'juc-6',
    nameEn: 'BLUEBERRY FRAPPE (CLASSIC)',
    nameAr: 'فرابيه التوت الأزرق كلاسيك',
    price: 10,
    descriptionEn: 'Refreshing light iced blend of sweet blueberry syrup and crushed shaved ice.',
    descriptionAr: 'فرابيه التوت الأزرق الكلاسيكي الخفيف والمنعش لمقاومة حرارة الصيف.',
    category: 'juice',
    image: 'blue_f_c'
  },
  {
    id: 'juc-7',
    nameEn: 'STRAWBERRY SMOOTHIE',
    nameAr: 'سموذي الفراولة',
    price: 15,
    descriptionEn: 'Frozen whole organic strawberry halves blended with milk and sweet cane sugar.',
    descriptionAr: 'سموذي الفراولة الطبيعي المثلج والمعد مخفوقاً بعناية فائقة.',
    category: 'juice',
    image: 'straw_smoothie'
  },

  // Hot Drinks
  {
    id: 'hot-1',
    nameEn: 'ESPRESSO',
    nameAr: 'اسبريسو',
    price: 9,
    descriptionEn: 'Concentrated full-bodied coffee shot with elegant golden crema top.',
    descriptionAr: 'جرعة إسبريسو غنية ومركزة مستخلصة بعناية من أجود حبوب البن.',
    category: 'hot',
    image: 'espresso'
  },
  {
    id: 'hot-2',
    nameEn: 'TURKISH COFFEE',
    nameAr: 'قهوه تركي',
    price: 10,
    descriptionEn: 'Delicately boiled ground fine coffee, unsweetened, with foam cap.',
    descriptionAr: 'القهوة التركية التقليدية الساخنة مطحونة ومغلية برغوة دافئة كلاسيكية.',
    category: 'hot',
    image: 'turkish'
  },
  {
    id: 'hot-3',
    nameEn: 'MACCHIATO',
    nameAr: 'ميكاتو',
    price: 10,
    descriptionEn: 'Pure espresso shot "marked" with a dollop of foamed milk.',
    descriptionAr: 'جرعة إسبريسو كلاسيكية مرقطة بلمسة خفيفة ورقيقة من رغوة الحليب.',
    category: 'hot',
    image: 'macchiato'
  },
  {
    id: 'hot-4',
    nameEn: 'HAZELNUT LATTE',
    nameAr: 'لاتيه بالبندق',
    price: 15,
    descriptionEn: 'Espresso mixed with sweet premium hazelnut syrup and hot steamed milk.',
    descriptionAr: 'لاتيه ساخن ولذيذ مضاف إليه شراب البندق الفاخر وحليب مبخر رغوي.',
    category: 'hot',
    image: 'hazel_latte'
  },
  {
    id: 'hot-5',
    nameEn: 'HOT LATTE',
    nameAr: 'لاتيه',
    price: 12,
    descriptionEn: 'Perfect ratio of espresso, silky hot microfoam, and sweet steamed milk.',
    descriptionAr: 'لاتيه كلاسيكي متناغم يجمع دفء الحليب وإسبريسو غني بالنكهة.',
    category: 'hot',
    image: 'hot_latte'
  },
  {
    id: 'hot-6',
    nameEn: 'PISTACHIO LATTE',
    nameAr: 'بستاشيو لاتيه حار',
    price: 16,
    descriptionEn: 'Bold espresso shot with warm, high-quality sweet pistachio milk steam.',
    descriptionAr: 'بستاشيو لاتيه حار يدمج خلاصة الفستق الطبيعي والقهوة لدفء ممتاز.',
    category: 'hot',
    image: 'pist_latte'
  },
  {
    id: 'hot-7',
    nameEn: 'CAPPUCCINO',
    nameAr: 'كابتشينو',
    price: 12,
    descriptionEn: 'Equal parts coffee, hot textured milk, and thick, luxurious pillow foam.',
    descriptionAr: 'كابوتشينو كلاسيكي دافئ بطبقة غنية وسميكة من رغوة الحليب والكاكاو.',
    category: 'hot',
    image: 'cappuccino'
  },
  {
    id: 'hot-8',
    nameEn: 'HOT MATCHA',
    nameAr: 'ماتشا حار',
    price: 16,
    descriptionEn: 'Japanese ground stone premium matcha whisked into hot velvety milk.',
    descriptionAr: 'شاي الماتشا الأخضر الساخن والمحضر برغوة كريمية دافئة ومريحة.',
    category: 'hot',
    image: 'hot_matcha'
  },
  {
    id: 'hot-9',
    nameEn: 'TURKISH COFFEE WITH MILK',
    nameAr: 'قهوه تركي بالحليب',
    price: 12,
    descriptionEn: 'Turkish boiled coffee prepared entirely using warm sweet standard whole milk.',
    descriptionAr: 'القهوة التركية البديعة والمطبوخة مباشرة بالحليب الطازج الدافئ.',
    category: 'hot',
    image: 'turkish_milk'
  },
  {
    id: 'hot-10',
    nameEn: 'ARABIC COFFEE (FLASK)',
    nameAr: 'ثلاجة قهوة عربية',
    price: 17,
    descriptionEn: 'Arabic coffee brewed with cardamom and saffron, served in full heat-retaining flask.',
    descriptionAr: 'دلة قهوة عربية شقراء محضرة بالهيل والزعفران على الأصول للضيافة.',
    category: 'hot',
    image: 'arabic_coffee'
  },
  {
    id: 'hot-11',
    nameEn: 'FLAT WHITE',
    nameAr: 'فلات وايت',
    price: 15,
    descriptionEn: 'Bold ristretto espresso shot poured with tight, silky microfoam layered over.',
    descriptionAr: 'فلات وايت الكثيف بإسبريسو ريستريتو مزدوج وطبقة حليب دقيقة وناعمة.',
    category: 'hot',
    image: 'flat_white'
  },
  {
    id: 'hot-12',
    nameEn: 'SPANISH LATTE',
    nameAr: 'سبانش لاتيه حار',
    price: 15,
    descriptionEn: 'Sweet condensed milk, premium espresso, hot steamed silky milk.',
    descriptionAr: 'سبانش لاتيه دافئ ولذيذ بمزيج الحليب المكثف المحلى المثير والعميق.',
    category: 'hot',
    image: 'spanish_latte_h'
  },
  {
    id: 'hot-13',
    nameEn: 'AMERICANO',
    nameAr: 'أمريكانو',
    price: 9,
    descriptionEn: 'Perfect simple wake-up cup made with espresso extracts and hot water dilution.',
    descriptionAr: 'أمريكانو كلاسيكي ساخن بجرعة إسبريسو مخففة بالماء الساخن من دون سكر.',
    category: 'hot',
    image: 'americano_h'
  },
  {
    id: 'hot-14',
    nameEn: 'CARAMEL MACCHIATO',
    nameAr: 'كراميل ميكاتو',
    price: 15,
    descriptionEn: 'Vanilla notes, hot milk, espresso, dressed with signature caramel warm grids.',
    descriptionAr: 'كراميل ميكاتو دافئ غني برغوة الكراميل اللذيذة صوص حلاوة عالي.',
    category: 'hot',
    image: 'caramel_mac_h'
  },
  {
    id: 'hot-15',
    nameEn: 'CORTADO',
    nameAr: 'كورتادو',
    price: 12,
    descriptionEn: 'Balanced double shot espresso with equal amount of textured silky steam milk.',
    descriptionAr: 'جرعة كورتادو المركزة والمثالية بنسبة ١:١ قهوة وحليب ناعم فوم أقل.',
    category: 'hot',
    image: 'cortado'
  },
  {
    id: 'hot-16',
    nameEn: 'HOT CHOCOLATE',
    nameAr: 'هوت شوكلت',
    price: 15,
    descriptionEn: 'Velvety sweet melted premium chocolate blend with hot steamed milk and foam.',
    descriptionAr: 'مشروب الشوكولاتة الساخنة الغني بالكاكاو والحليب المخملي اللطيف.',
    category: 'hot',
    image: 'hot_chocolate'
  },
  {
    id: 'hot-17',
    nameEn: 'V60 HOT',
    nameAr: 'V60 حار',
    price: 16,
    descriptionEn: 'Filter coffee drip using V60 pour over method bringing out delicate coffee notes.',
    descriptionAr: 'قهوة مقطرة حارة V60 من بذور البن الفاخرة للاستمتاع بالطعم النقي الأصلي.',
    category: 'hot',
    image: 'v60_hot'
  },
];
