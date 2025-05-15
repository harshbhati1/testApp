import React, { useState } from 'react';
import UserAvatar from './UserAvatar';

/**
 * AvatarTester component for testing different avatar configurations
 * This is a development tool to help visualize how avatars will appear
 * with different settings
 */
const AvatarTester = () => {
  const [name, setName] = useState('Test User');
  const [size, setSize] = useState('md');
  const [colorScheme, setColorScheme] = useState('purple');
  const [background, setBackground] = useState('random');
  const [color, setColor] = useState('fff');
  const [rounded, setRounded] = useState(true);
  const [bold, setBold] = useState(true);
  const [length, setLength] = useState(2);

  // Available sizes
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  // Available color schemes
  const colorSchemes = [
    'purple', 'blue', 'green', 'red', 
    'amber', 'teal', 'gray', 'dark', 'light'
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Avatar Tester</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1 rounded ${
                    size === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Scheme
            </label>
            <div className="flex flex-wrap gap-2">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => setColorScheme(scheme)}
                  className={`px-3 py-1 rounded ${
                    colorScheme === scheme
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {scheme}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Background
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Color hex or 'random'"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Color hex"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="rounded"
                checked={rounded}
                onChange={(e) => setRounded(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="rounded" className="text-sm font-medium text-gray-700">
                Rounded
              </label>
            </div>
            
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="bold"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="bold" className="text-sm font-medium text-gray-700">
                Bold
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Length
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              min="1"
              max="4"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Preview</h3>
          <div className="mb-6">
            <UserAvatar
              name={name}
              size={size}
              colorScheme={colorScheme !== '' ? colorScheme : undefined}
              background={background}
              color={color}
              rounded={rounded}
              bold={bold}
              length={length}
              className="shadow-md"
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Size class: {size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarTester;
