import './index.css';
import { useAppStore } from './game/engine/appStore';
import StartScreen from './screens/StartScreen/StartScreen';
import CharacterSelect from './screens/CharacterSelect/CharacterSelect';
import WorldSelect from './screens/WorldSelect/WorldSelect';
import HowToPlay from './screens/HowToPlay';
import Achievements from './screens/Achievements/Achievements';
import Settings from './screens/Settings/Settings';
import GameScreen from './screens/GameScreen/GameScreen';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const { screen, save } = useAppStore();

  return (
    <div className="learning-run-container">
      <div className={`app-root ${save.settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <ErrorBoundary onReset={() => useAppStore.getState().goTo('start')}>
          {screen === 'start' && <StartScreen />}
          {screen === 'worldSelect' && <WorldSelect />}
          {screen === 'characterSelect' && <CharacterSelect />}
          {screen === 'howToPlay' && <HowToPlay />}
          {screen === 'achievements' && <Achievements />}
          {screen === 'settings' && <Settings />}
          {screen === 'game' && <GameScreen />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
