import datetime as dt
import uuid
from pathlib import Path

from geopy.exc import GeocoderServiceError
from geopy.geocoders import Nominatim
from src.services.image.image import ImageService
from src.services.post.post import PostService

dummy_data_list = [
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_1.jpg",
        "post_id": "a3c0b2f1-7d86-4c2e-8a37-5f2b9e14c6d2",
        "user_id": "010efbf5-ddf7-4ee9-9b25-45347fa61113",
        "user_question": "この鳥はなんていう鳥？",
        "object_label": "オシドリ",
        "ai_answer": "オシドリは、カモ科に属する鳥類です。オスはカラフルで美しい羽衣を持ち、メスは地味な色をしています。水面を優雅に泳ぎ、潜水して水草などを食べます。日本では、冬鳥として全国各地で見られます。繁殖期には、山地の森林に生息し、樹洞に巣を作ります。",
        "ai_question": "オシドリのオスとメスの羽衣の違いは、どのような進化上の理由によるものと考えられますか？",
        "latitude": 41.342478,
        "longitude": 143.074285,
        "date": "2025-05-30T05:12:00Z",  # 5/30 14:12 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_2.jpg",
        "post_id": "e9f7d2c4-1a3b-4d58-9b6e-12c34f78a9bc",
        "user_id": "010efbf5-ddf7-4ee9-9b25-45347fa61113",
        "user_question": "この小さな白い花は何？",
        "object_label": "ヒナギク",
        "ai_answer": "緑豊かな芝生の中に、無数の白いヒナギクが咲いています。花びらの白い色と中心部の黄色のコントラストが美しく、春の訪れを感じさせる光景です。木々が立ち並ぶ公園や庭園といった、自然豊かな環境に咲いている様子が伺えます。これらのヒナギクは、密集して咲いているため、まるで白い絨毯を敷き詰めたようにも見えます。",
        "ai_question": "このヒナギク畑は、自然にできたものなのか、それとも人工的に植えられたものなのか、どのようにしてこんなに多くのヒナギクが群生しているのでしょうか？",
        "latitude": 43.071488,
        "longitude": 141.342434,
        "date": "2025-06-04T04:06:00Z",  # 6/4 13:06 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_3.jpg",
        "post_id": "5b1e3c8a-2f46-4a0d-b3e1-7d9c2a5f6e10",
        "user_id": "1642e3c7-15ec-4fbc-a923-c31285b3b680",
        "user_question": "この地面にたくさん落ちている白い綿は何？",
        "object_label": "ポプラの種",
        "ai_answer": "地面に大量の白い綿毛のようなものが落ちています。これはポプラの種で、風に乗って遠くまで運ばれ、繁殖します。綿毛は非常に軽く、風によって容易に拡散するため、このようにまとまって地面に積もることがあります。ポプラは街路樹などによく植えられており、春から初夏にかけて種を飛ばします。",
        "ai_question": "ポプラの種は、風に乗ってどのくらいの距離まで運ばれるのでしょうか？",
        "latitude": 43.073872,
        "longitude": 141.342625,
        "date": "2025-06-17T07:12:00Z",  # 6/17 16:12 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_4.jpg",
        "post_id": "0f7a9b2c-5d13-4c8e-8d74-3a1c5e9f2b60",
        "user_id": "010efbf5-ddf7-4ee9-9b25-45347fa61113",
        "user_question": "この花は何？",
        "object_label": "ライラック",
        "ai_answer": "ライラックは、モクセイ科ハシドイ属の落葉低木です。春に芳香のある美しい花を咲かせ、紫、白、ピンクなど様々な色があります。花は円錐花序に多数つき、観賞用として庭や公園などに広く植栽されています。香りが強く、香水や石鹸などの原料にも利用されます。ヨーロッパ原産で、日本には明治時代に渡来しました。",
        "ai_question": "ライラックの香りは、どのような香りと表現するのが最も適切でしょうか？",
        "latitude": 43.059824,
        "longitude": 141.345468,
        "date": "2025-05-17T07:12:00Z",  # 5/17 16:12 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_5.jpg",
        "post_id": "3c9e5a1b-6f20-4d3a-a1e4-9b2c7d5e3f18",
        "user_id": "1642e3c7-15ec-4fbc-a923-c31285b3b680",
        "user_question": "これは何リス？",
        "object_label": "エゾリス",
        "ai_answer": "写真に写っているのはエゾリスです。岩の上に座り、周囲の木々の枝の間からこちらを見ている様子がわかります。エゾリスは日本固有種で、北海道に生息しています。体毛は灰褐色で、冬毛はふさふさしています。木の実や昆虫などを食べ、樹上で生活します。",
        "ai_question": "エゾリスの生息数は、近年どのように変化しているのでしょうか？",
        "latitude": 43.071291,
        "longitude": 141.346283,
        "date": "2025-06-12T04:12:00Z",  # 6/12 13:12 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_6.jpg",
        "post_id": "7e2b1c3d-8a5f-4f61-96b3-0c4d2a7e9b35",
        "user_id": "010efbf5-ddf7-4ee9-9b25-45347fa61113",
        "user_question": "このソメイヨシノについて教えて",
        "object_label": "ソメイヨシノ",
        "ai_answer": "このソメイヨシノについて教えて",
        "ai_question": "ソメイヨシノは、クローンであるため遺伝的多様性に乏しいとされていますが、その理由と、将来的にそのことがソメイヨシノの存続にどう影響する可能性があるか、説明してください。",
        "latitude": 43.081138,
        "longitude": 141.338180,
        "date": "2025-05-01T02:31:00Z",  # 5/1 11:31 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_7.jpg",
        "post_id": "b1d2e3f4-09ac-4c7b-892e-5f6a1b2c3d48",
        "user_id": "1642e3c7-15ec-4fbc-a923-c31285b3b680",
        "user_question": "これは何という蝶々？",
        "object_label": "ミドリヒョウモン",
        "ai_answer": "ミドリヒョウモンはタテハチョウ科に属するチョウの一種です。翅の表側はオレンジ色で、黒い斑点と縁取りがあります。翅の裏側は緑色を帯びた褐色で、複雑な模様があります。主に山地の草原や林縁などに生息し、幼虫はスミレ類を食草としています。成虫は夏に発生し、花で吸蜜したり、湿地で吸水したりします。オスは縄張り意識が強く、他のオスを追い払う行動が見られます。",
        "ai_question": "ミドリヒョウモンのオスとメスの違いは、見た目ではどのように判別できるのでしょうか？",
        "latitude": 43.747251,
        "longitude": 142.315515,
        "date": "2025-08-12T04:45:00Z",  # 8/12 13:45 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_8.jpg",
        "post_id": "c0a1b2d3-e4f5-4a6b-8c9d-1e2f3a4b5c6d",
        "user_id": "1642e3c7-15ec-4fbc-a923-c31285b3b680",
        "user_question": "綺麗な夕方の景色が撮れたよ",
        "object_label": "夕焼けと都市風景",
        "ai_answer": "画像には、夕日に染まる山並みを背景に、平野に広がる都市風景が写っています。空には、雲が複雑に広がり、太陽の光が雲の隙間から差し込んでいる様子が分かります。手前には緑の木々が茂っており、その向こうに住宅地や建物が続き、奥には山々が連なっています。全体的に静かで穏やかな、そして美しい夕景が印象的です。",
        "ai_question": "この夕焼けの空の色合いから、その日の大気中の湿度や空気の状態を推測することはできますか？",
        "latitude": 43.076149,
        "longitude": 141.338821,
        "date": "2025-08-19T08:42:00Z",  # 8/19 17:42 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_1.jpg",
        "post_id": "883e9566-63e2-3090-77c7-266052444b5b",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "ヤギの瞳孔はなぜ横長なの？",
        "object_label": "ヤギ",
        "ai_answer": "画像には、草が生い茂る地面に2頭のヤギが写っています。手前の1頭は全身が白い毛で覆われており、奥の1頭は黒と白の毛が混じった模様をしています。ヤギは一般的に丈夫で飼いやすい動物とされており、高山帯に生息する種類が多く、高い場所に登ることを好むという生態的特徴があります。草食動物であるヤギは、捕食者から身を守るために広い視野を持つ必要があり、その瞳孔は水平に細長い形をしています。また、草を食べるために頭を下げた時でも、瞳孔が常に地面と平行になるように眼球が回転するという興味深い仕組みを持っています。",
        "ai_question": "ヤギの横長の瞳孔は、暗い場所ではどのように変化するのでしょうか？",
        "ai_reference": "https://tierzine.com/others/goat-behavior-guide/",
        "latitude": 34.727689,
        "longitude": 134.384112,
        "date": "2022-09-22T07:06:00Z",  # 9/22 16:06 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_2.jpg",
        "post_id": "73ab5878-68cc-f965-f423-864329840c81",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "お城の庭に松の木が植えられているのはなぜ？",
        "object_label": "姫路城と松の木",
        "ai_answer": "この画像には、その美しい白い外観から「白鷺城」とも称される日本の国宝であり世界文化遺産である姫路城が写っています。複数の層を持つ天守閣と特徴的な白い漆喰の壁が印象的です。手前には手入れの行き届いた日本庭園が広がり、松の木が配置されています。松の木は、その常緑性から長寿や縁起の良さを象徴するとともに、城の内部を外部から隠す目隠しの役割も果たしていたと考えられています。姫路城は、その優れた建築美と防御機能から、日本が誇る城郭建築の最高傑作の一つとされています。",
        "ai_question": "姫路城が「白鷺城」と呼ばれるようになった具体的な由来は何ですか？",
        "ai_reference": "https://www.miraikoji.com/column/6412/",
        "latitude": 34.838000,
        "longitude": 134.692000,
        "date": "2025-02-22T05:53:00Z",  # 2/22 14:53 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_3.jpg",
        "post_id": "9b7af7d6-db5b-c40e-58ca-dbbeb2359dda",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "菜の花の名前の由来は？",
        "object_label": "菜の花畑",
        "ai_answer": "この画像は、見渡す限りに広がる鮮やかな黄色の菜の花畑を捉えています。畑の奥には緑豊かな木々が連なり、そのさらに遠方には雪をかぶった山々が霞んで見え、空には白い雲が浮かんでいます。菜の花とは、アブラナ科アブラナ属の植物の花の総称で、特にアブラナやセイヨウアブラナの別名としても使われます。名前の「菜」は食用を意味しており、「食べられる花」という意味合いから名付けられました。菜の花は菜種油の原料となるほか、若葉や花茎は食用としても親しまれ、春の訪れを告げる風物詩として鑑賞用にも栽培されています。日本では、一般的に2月から5月頃に開花し、北海道などでは5月中旬から6月上旬が見頃となります。",
        "ai_question": "菜の花が日本の春の風物詩とされるのはなぜでしょうか？",
        "ai_reference": "https://ja.m.wikipedia.org/wiki/%E8%8F%9C%E3%81%AE%E8%8A%B1",
        "latitude": 43.529000,
        "longitude": 142.467000,
        "date": "2025-05-24T02:57:00Z",  # 5/24 11:57 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_4.jpg",
        "post_id": "800b9370-76f2-ba17-ce10-fa47249aef7e",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "吊り橋ってどうやって作るの？",
        "object_label": "吊り橋",
        "ai_answer": "この画像には、深い緑の森が広がる谷に架かる吊り橋が映し出されており、数名の人が橋を渡っています。吊り橋は、2つの主塔の間に張られたメインケーブルから垂直に垂らされたハンガーロープで橋桁を吊り下げて支える構造の橋です。その建設では、まず主塔の基礎が作られ、特に海中に基礎を築く場合は、ドーナツ状の鉄製ケーソンを浮かべて所定の位置に運び、コンクリートを詰めて沈める方法が用いられます。次に、主塔が建設され、その間にメインケーブルが架設されます。このメインケーブルは、橋の両端にある巨大なコンクリート製のアンカレイジ（係留装置）にしっかりと固定され、橋にかかる荷重による張力を支えます。最後に、メインケーブルからハンガーロープを垂らし、橋桁（補剛桁）を取り付けて完成となります。",
        "ai_question": "吊り橋は、地震や強風に対してどのように設計上の工夫がされているのでしょうか？",
        "ai_reference": "http://asait.world.coocan.jp/kuiper_belt/canal16/suspension_bridge.htm",
        "latitude": 35.150000,
        "longitude": 138.981000,
        "date": "2025-08-12T04:17:00Z",  # 8/12 13:17 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_5.jpg",
        "post_id": "9faec4db-58d3-0040-6332-a481c665b33c",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "この花は何？なぜ水の上に花を咲かせるの？",
        "object_label": "スイレン",
        "ai_answer": "この画像には、水面に美しく咲くピンク色のスイレンが写っています。スイレンはスイレン科の水生植物で、水中の地下茎から長い茎を伸ばし、水面に葉や花を浮かせて開花します。水に浮かぶ葉は光合成のために気孔が葉の表側にあり、多くの種類は日中に花を開き、夜には閉じるという特徴があります。この「眠る」ような習性から「睡蓮」という漢字が当てられています。",
        "ai_question": "スイレンとよく似たハスの花は、どのような点でスイレンと区別できるのでしょうか？",
        "ai_reference": "https://garden-vision.net/flower/sagyo/s_nymphaea.html",
        "latitude": 35.312684,
        "longitude": 139.533570,
        "date": "2023-08-25T02:36:00Z",  # 8/25 11:36 JST
    },
    {
        "img_path": "/backend/src/dummy_data/dummy_images/dummy_shin_6.jpg",
        "post_id": "d1fd3b9a-e217-33d5-bfc5-45bdd45ff1ba",
        "user_id": "79b94756-f960-a5ca-1374-06dec8752641",
        "user_question": "この花は何？",
        "object_label": "エゴノキ",
        "ai_answer": "画像に写っているのは「エゴノキ」（Styrax japonicus）の花です。エゴノキは日本、朝鮮半島、中国に自生するエゴノキ科の落葉高木で、英名では「Japanese Snowbell」（日本のスノーベル）と呼ばれます。毎年5月から6月頃に、枝先に白い釣鐘状の可愛らしい花をたくさん下向きに咲かせ、その様子は雪が積もったように見え、かすかに甘い香りを放ちます。葉は卵形から倒卵形で、明るい緑色をしており、秋には黄色く色づくこともあります。 エゴノキという名前は、果実の皮にサポニンが多く含まれ、口に入れると「えぐい（えごい）」味がすることに由来すると言われています。この果実は、ヤマガラなどの野鳥の大好物でもあります。花言葉は「壮大」「清楚」とされており、その美しい花姿が人々を魅了します。 古くから人々の生活と深く関わってきた木であり、硬い材はろくろ細工、傘の柄、将棋の駒などに利用され、果皮は石鹸の代わりや、昔は魚を捕るために利用されたこともあります。",
        "ai_question": "エゴノキの花は、開花時期以外にどのような季節の変化を見せるのでしょうか？",
        "ai_reference": "https://en.m.wikipedia.org/wiki/Styrax_japonicus",
        "latitude": 43.072752,
        "longitude": 141.341875,
        "date": "2024-05-19T04:58:00Z",  # 5/19 13:58 JST
    },
]


def _parse_iso8601_utc(s: str) -> dt.datetime:
    """'2025-05-30T05:12:00Z' -> aware datetime(UTC)"""
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))


def _reverse_geocode(lat: float, lon: float) -> str:
    geolocator = Nominatim(user_agent="my_geocoder_dummy_loader", timeout=10)
    try:
        location = geolocator.reverse((lat, lon), language="ja", exactly_one=True)
    except GeocoderServiceError:
        return "不明な場所"
    return location.address if location else "不明な場所"


def _load_file_bytes(path: str) -> bytes:
    p = Path(path)
    with p.open("rb") as f:
        return f.read()


def dummy_data_generator() -> None:
    """
    ダミーデータを Cloud SQL と Cloud Storage に保存する
    """
    for d in dummy_data_list:
        # 1) 画像を登録する（bytes と正しい MIME を渡す）
        try:
            file_bytes = _load_file_bytes(d["img_path"])
            result_save_img = ImageService.save_image(
                file_data=file_bytes,
                mime_type="image/jpeg",  # jpg ではなく MIME を渡す
            )
            if not result_save_img or "img_id" not in result_save_img:
                print(f"error: 画像の保存に失敗しました, img_path: {d['img_path']}")
                return
        except RuntimeError as e:
            print(f"error: サービス初期化エラー, detail: {str(e)}")
            return
        except Exception as e:
            print(f"error: 予期せぬエラーが発生しました, detail: {str(e)}")
            return

        # 2) 投稿を登録する
        img_id = uuid.UUID(str(result_save_img["img_id"]))
        location = _reverse_geocode(d["latitude"], d["longitude"])

        try:
            result_create_post = PostService.create_post(
                post_id=uuid.UUID(str(d["post_id"])),
                user_id=d["user_id"],
                img_id=img_id,
                user_question=d["user_question"],
                object_label=d["object_label"],
                ai_answer=d["ai_answer"],
                ai_question=d["ai_question"],
                location=location,
                latitude=float(d["latitude"]),
                longitude=float(d["longitude"]),
                date=_parse_iso8601_utc(d["date"]),  # ← 正しいキーと型
            )
            if result_create_post is None:
                print(f"error: 投稿の保存に失敗しました, post_id: {d['post_id']}")
                return
        except RuntimeError as e:
            print(f"error: DB初期化エラー, detail: {str(e)}")
            return

    print("全てのデータの登録を完了しました！")


def main():
    print("-------------------------------------------")
    print("「dummy_data_generator」と入力してください")
    print("-------------------------------------------")
    input_str = input(">> ")
    if "dummy_data_generator" != input_str:
        print("終了します。")
        return
    dummy_data_generator()


if __name__ == "__main__":
    main()
