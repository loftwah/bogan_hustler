import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faTimes, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const FloatingInventory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { inventory, inventorySpace, cash } = useSelector((state: RootState) => state.player);
  const currentSpace = inventory.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const button = document.getElementById('floating-inventory-btn');
    if (button) {
      button.classList.add('pulse');
      setTimeout(() => button.classList.remove('pulse'), 1000);
    }
  }, [inventory]);

  if (!isOpen) {
    return (
      <button 
        id="floating-inventory-btn"
        className="fixed bottom-24 right-4 md:right-8 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-opacity-80"
        onClick={() => setIsOpen(true)}
        aria-label="Show inventory"
      >
        <FontAwesomeIcon icon={faBox} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 md:right-8 w-80 md:w-96 bg-surface rounded-lg shadow-lg border border-border animate-slideIn">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-bold">Inventory</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-2xl hover:text-primary"
          aria-label="Close inventory"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between text-sm">
          <span>Space: {currentSpace}/{inventorySpace}</span>
          <span>Cash: ${cash}</span>
        </div>
        
        {inventory.length === 0 ? (
          <div className="text-center py-8 text-text/50">
            <FontAwesomeIcon icon={faBoxOpen} className="text-3xl mb-2" />
            <p>Your inventory is empty</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {inventory.map(item => (
              <div key={item.name} className="flex justify-between py-1 border-b border-border last:border-0">
                <span>{item.name}</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingInventory; 