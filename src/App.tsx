import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store/store'
import { travel } from './store/playerSlice'
import './App.css'

function App() {
  const dispatch = useDispatch()
  const { cash, location, currentDay } = useSelector((state: RootState) => state.player)
  const marketData = useSelector((state: RootState) => state.market)
  const prices = location in marketData.prices ? marketData.prices[location] : null

  return (
    <div className="app">
      <h1>Bogan Hustler</h1>
      <div>
        <p>Cash: ${cash}</p>
        <p>Location: {location}</p>
        <p>Day: {currentDay}</p>
        <button onClick={() => dispatch(travel('Melbourne'))}>
          Travel to Melbourne
        </button>
      </div>
      <div>
        <h2>Available Drugs in {location}:</h2>
        <ul>
          {prices && Object.entries(prices).map(([drug, { price }]) => (
            <li key={drug}>
              {drug}: ${price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
