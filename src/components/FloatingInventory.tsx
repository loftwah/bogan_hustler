import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

const FloatingInventory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { inventory, inventorySpace, cash } = useSelector((state: RootState) => state.player);
  const currentSpace = inventory.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen) {
    return (
      <button 
        className="fixed bottom-safe-bottom right-4 mb-20 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-opacity-80"
        onClick={() => setIsOpen(true)}
        aria-label="Show inventory"
      >
        📦
      </button>
    );
  }

  return (
    <div className="fixed bottom-safe-bottom right-4 mb-20 w-80 md:w-96 bg-surface rounded-lg shadow-lg border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-bold">Inventory</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-2xl hover:text-primary"
          aria-label="Close inventory"
        >×</button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between text-sm">
          <span>Space: {currentSpace}/{inventorySpace}</span>
          <span>Cash: ${cash}</span>
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {inventory.map(item => (
            <div key={item.name} className="flex justify-between py-1 border-b border-border last:border-0">
              <span>{item.name}</span>
              <span>{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingInventory; 