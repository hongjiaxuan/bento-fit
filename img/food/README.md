# 食材圖片（Food Images）

App 會依食材名稱對應下表的 **id**，讀取 `img/food/<id>.png`。
檔案還沒放入時，畫面自動顯示表中的 emoji；放入後重新整理即生效，**不用改程式**。

## 圖片規格（建議全部一致）
- 檔名：`<id>.png`（英文小寫，與下表相同）
- 尺寸：512×512，**透明背景**，主體置中、四周留約 10% 空白
- 入庫時會壓縮成 256×256（量化 PNG，每張約 10KB），畫面上看不出差異；請保留 512 原檔在自己電腦
- 風格：同一套扁平插畫風（建議 AI 繪圖時固定同一段風格描述，例如：
  `flat vector illustration, soft pastel colors, single food item, centered, transparent background, no text`）

## 對應表（比對順序由上而下，先符合者優先）

| id（檔名） | 對應項目 | 比對關鍵字 | 未放圖時的 emoji | 備好的料理 |
|---|---|---|---|---|
| `seasoning.png` | 調味料 | 醬油、豆瓣、味醂、蠔油、醬$、鹽、糖、橄欖油、麻油、沙拉油、香油、醋、米酒、料理酒、太白粉、地瓜粉、麵粉、胡椒、咖哩塊、咖哩粉、味噌、高湯塊、雞粉 | 🧂 |  |
| `braised.png` | 滷味／燉菜（備好） | 滷、紅燒、燉、焢 | 🍲 | 是 |
| `curry.png` | 咖哩（備好） | 咖哩 | 🍛 | 是 |
| `dumpling.png` | 水餃／包子 | 水餃、餃、包子、餛飩 | 🥟 |  |
| `soup.png` | 湯品（備好） | 湯 | 🥣 | 是 |
| `cooked-meal.png` | 熟食／便當（備好） | 炒飯、便當、熟飯、炒麵 | 🍱 | 是 |
| `prepped.png` | 備好的料理 | 備好、已醃、醃好、半成品、已切、切好 | 🥡 | 是 |
| `milk.png` | 牛奶 | 牛奶、鮮奶、奶 | 🥛 |  |
| `cheese.png` | 起司 | 起司、乳酪 | 🧀 |  |
| `yogurt.png` | 優格 | 優格、優酪 | 🥛 |  |
| `egg.png` | 蛋 | 蛋 | 🥚 |  |
| `shrimp.png` | 蝦 | 蝦 | 🦐 |  |
| `crab.png` | 蟹 | 蟹 | 🦀 |  |
| `squid.png` | 花枝／透抽 | 花枝、透抽、魷、章魚、小卷 | 🦑 |  |
| `shellfish.png` | 貝類 | 蛤、蚵、貝、淡菜 | 🦪 |  |
| `salmon.png` | 鮭魚 | 鮭 | 🐟 |  |
| `fish.png` | 魚 | 魚、鯖、鯛、鱈、鮪 | 🐟 |  |
| `chicken.png` | 雞肉 | 雞 | 🍗 |  |
| `bacon.png` | 培根／火腿 | 培根、火腿、香腸 | 🥓 |  |
| `pork.png` | 豬肉 | 豬、五花、梅花、里肌 | 🥩 |  |
| `beef.png` | 牛肉 | 牛 | 🥩 |  |
| `meat.png` | 肉類 | 肉、排、羊 | 🥩 |  |
| `tofu.png` | 豆腐 | 豆腐、豆干、豆皮 | 🧈 |  |
| `beans.png` | 豆類 | 毛豆、四季豆、甜豆、豌豆、豆 | 🫛 |  |
| `mushroom.png` | 菇類 | 菇、蕈、木耳 | 🍄 |  |
| `broccoli.png` | 花椰菜 | 花椰、青花 | 🥦 |  |
| `carrot.png` | 紅蘿蔔 | 紅蘿蔔、胡蘿蔔 | 🥕 |  |
| `radish.png` | 白蘿蔔 | 白蘿蔔、蘿蔔 | 🥕 |  |
| `onion.png` | 洋蔥 | 洋蔥 | 🧅 |  |
| `garlic.png` | 蒜 | 蒜 | 🧄 |  |
| `ginger.png` | 薑 | 薑 | 🫚 |  |
| `tomato.png` | 番茄 | 番茄、蕃茄 | 🍅 |  |
| `corn.png` | 玉米 | 玉米 | 🌽 |  |
| `cucumber.png` | 小黃瓜／櫛瓜 | 小黃瓜、黃瓜、櫛瓜 | 🥒 |  |
| `eggplant.png` | 茄子 | 茄子 | 🍆 |  |
| `pepper.png` | 甜椒／辣椒 | 椒 | 🫑 |  |
| `sweet-potato.png` | 地瓜 | 地瓜、番薯 | 🍠 |  |
| `potato.png` | 馬鈴薯 | 馬鈴薯、洋芋 | 🥔 |  |
| `pumpkin.png` | 南瓜 | 南瓜 | 🎃 |  |
| `avocado.png` | 酪梨 | 酪梨 | 🥑 |  |
| `apple.png` | 蘋果 | 蘋果 | 🍎 |  |
| `banana.png` | 香蕉 | 香蕉 | 🍌 |  |
| `berry.png` | 莓果 | 莓 | 🍓 |  |
| `lemon.png` | 檸檬 | 檸檬 | 🍋 |  |
| `orange.png` | 柑橘 | 橘、柳丁、橙 | 🍊 |  |
| `kiwi.png` | 奇異果 | 奇異果 | 🥝 |  |
| `herb.png` | 香草 | 九層塔、香菜、羅勒、薄荷、迷迭香 | 🌿 |  |
| `scallion.png` | 蔥 | 蔥 | 🌱 |  |
| `cabbage.png` | 高麗菜／白菜 | 高麗菜、白菜 | 🥬 |  |
| `spinach.png` | 菠菜 | 菠菜 | 🥬 |  |
| `leafy-greens.png` | 葉菜類 | 菜、芹、筍、萵苣、豆芽、蘆筍、地瓜葉 | 🥬 |  |
| `rice.png` | 米飯 | 飯、米 | 🍚 |  |
| `noodle.png` | 麵類 | 麵、義大利、冬粉、米粉 | 🍝 |  |
| `bread.png` | 麵包 | 吐司、麵包 | 🍞 |  |
| `fruit.png` | 水果 | 果 | 🍑 |  |
| `other.png` | 其他（都沒對到時） | — | 🥫 | |

> 新增或修改項目時，請同步修改 `index.html` 內的 `foodCatalog`。

> 每張的 AI 繪圖描述（可直接複製）見 [PROMPTS.md](PROMPTS.md)。
