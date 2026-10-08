// Vite emits separate files; importing URLs does not download the illustrations.
import sunny from '../../assets/images/weather/sunny.jpg'
import partlyCloudy from '../../assets/images/weather/partly-cloudy.jpg'
import overcast from '../../assets/images/weather/overcast.jpg'
import rainy from '../../assets/images/weather/rainy.jpg'
import thunderstorm from '../../assets/images/weather/thunderstorm.jpg'
import foggy from '../../assets/images/weather/foggy.jpg'
import clearNight from '../../assets/images/weather/clear-night.jpg'
import cloudyNight from '../../assets/images/weather/cloudy-night.jpg'
import rainyNight from '../../assets/images/weather/rainy-night.jpg'
import hot from '../../assets/images/weather/hot.jpg'
import hotNight from '../../assets/images/weather/hot-night.jpg'
import snow from '../../assets/images/weather/snow.jpg'

export const sceneAssets = {
  sunny, 'partly-cloudy': partlyCloudy, overcast, rainy, thunderstorm, foggy,
  'clear-night': clearNight, 'cloudy-night': cloudyNight, 'rainy-night': rainyNight,
  hot, 'hot-night': hotNight, snow,
}
