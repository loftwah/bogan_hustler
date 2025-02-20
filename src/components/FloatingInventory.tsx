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
        className="floating-inventory-toggle"
        onClick={() => setIsOpen(true)}
        title="Show Inventory"
      >
        📦
      </button>
    );
  }

  return (
    <div className="floating-inventory">
      <div className="floating-inventory-header">
        <h3>Inventory</h3>
        <button onClick={() => setIsOpen(false)}>×</button>
      </div>
      <div className="inventory-summary">
        <span>Space: {currentSpace}/{inventorySpace}</span>
        <span>Cash: ${cash}</span>
      </div>
      <div className="floating-inventory-list">
        {inventory.map(item => (
          <div key={item.name} className="floating-inventory-item">
            <span>{item.name}</span>
            <span>{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingInventory; 