import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const eventState = useSelector((state: RootState) => state.events.activeEvent);
  const playerState = useSelector((state: RootState) => state.player);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-24 z-[1000] bg-red-600 text-white px-3 py-1 rounded-md shadow-lg"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] overflow-auto p-4 pt-12">
      <div className="bg-surface rounded-lg p-4 text-sm max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Debug Panel</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 bg-red-600 text-white rounded-md"
          >
            Close
          </button>
        </div>

        {/* Event Info */}
        <div className="mb-4">
          <h4 className="font-bold mb-2">Active Event</h4>
          <div className="bg-black/30 p-3 rounded-lg">
            {eventState ? (
              <>
                <div><strong>ID:</strong> {eventState.id}</div>
                <div><strong>Description:</strong> {eventState.description}</div>
                <div><strong>Choices:</strong> {eventState.choices.length}</div>
              </>
            ) : (
              <p>No active event</p>
            )}
          </div>
        </div>

        {/* Player Info */}
        <div className="mb-4">
          <h4 className="font-bold mb-2">Player State</h4>
          <div className="bg-black/30 p-3 rounded-lg grid grid-cols-2 gap-2">
            <div><strong>Location:</strong> {playerState.location}</div>
            <div><strong>Cash:</strong> ${playerState.cash}</div>
            <div><strong>Day:</strong> {playerState.currentDay}/{playerState.maxDays}</div>
            <div><strong>Rep:</strong> {playerState.reputation}</div>
            <div><strong>Police Evasion:</strong> {playerState.policeEvasion}%</div>
            <div><strong>Inventory:</strong> {playerState.inventory.reduce((sum, item) => sum + item.quantity, 0)}/{playerState.inventorySpace}</div>
          </div>
        </div>

        {/* Event Control */}
        <div className="mb-4">
          <h4 className="font-bold mb-2">Debug Controls</h4>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                localStorage.setItem('lastEventTime', '0');
                alert('Event cooldown reset!');
              }}
              className="px-3 py-2 bg-primary text-white rounded-md"
            >
              Reset Event Cooldown
            </button>
            <button 
              onClick={() => {
                const lastEventTime = localStorage.getItem('lastEventTime');
                const timeSince = lastEventTime ? Math.round((Date.now() - Number(lastEventTime)) / 1000) : 'unknown';
                alert(`Last event: ${lastEventTime ? new Date(Number(lastEventTime)).toLocaleTimeString() : 'never'}\nSeconds since: ${timeSince}`);
              }}
              className="px-3 py-2 bg-surface border border-primary text-primary rounded-md"
            >
              Check Event Cooldown
            </button>
          </div>
        </div>

        {/* LocalStorage */}
        <div>
          <h4 className="font-bold mb-2">Device Info</h4>
          <div className="bg-black/30 p-3 rounded-lg text-xs">
            <p><strong>Mobile:</strong> {/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
            <p><strong>UserAgent:</strong> {navigator.userAgent}</p>
            <p><strong>Screen:</strong> {window.innerWidth}x{window.innerHeight}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;