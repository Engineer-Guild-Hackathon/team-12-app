from geopy.geocoders import Nominatim


def reverse_geocode(lat: float, lon: float) -> str:
    geolocator = Nominatim(user_agent="my_geocoder")
    location = geolocator.reverse((lat, lon), language="ja")
    if location:
        return location.address
    return "住所が見つかりませんでした"


# 例: 北海道大学付近
# 出力：　北海道大学, 北8条西5, 北区, 札幌市, 石狩振興局, 北海道, 060-0808, 日本
print(reverse_geocode(43.078, 141.34))
