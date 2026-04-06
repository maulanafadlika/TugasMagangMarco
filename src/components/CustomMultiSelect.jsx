import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

export default function CustomMultiSelect({ formData, setFormData }) {
  const items = formData.checkpoint || [{ position: 1, description: '', duedate: '', payment: false }];

  const handleChange = (id, field, value) => {
    const updatedItems = items.map(item =>
      item.position === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, checkpoint: updatedItems });
  };

  const addItem = () => {
    const newId = items.length > 0 
      ? Math.max(...items.map(item => item.position || 0), 0) + 1 
      : 1;
    const newItems = [
      ...items,
      { position: newId, description: '', duedate: '', payment: false },
    ];
    setFormData({ ...formData, checkpoint: newItems });
  };

    const removeItem = (id) => {
    if (items.length > 1) {
        const filteredItems = items.filter(item => item.position !== id);
        setFormData({ ...formData, checkpoint: filteredItems });
    } else {
        const clearedItems = items.map(item =>
        item.position === id ? { ...item, description: '', duedate: '', payment: false } : item
        );
        setFormData({ ...formData, checkpoint: clearedItems });
    }
    };

  return (
    <div className="max-w-md mx-2 bg-white rounded-lg shadow-sm text-sm">
      <h2 className="text-[17px] font-semibold mb-3">Check Point</h2>

      <div className="mb-2 flex justify-between items-center gap-2 text-gray-600 font-medium">
        <div className="w-[40%]">Description</div>
        <div className="w-[20%]">Due Date</div>
        <div className="w-[10%]">Paid</div>
        <div></div>
      </div>

      {items.map(item => (
        <div key={item.position} className="mb-2 flex justify-between items-center gap-2">
          <div className="col-span-5">
            <input
              type="text"
              value={item.description}
              onChange={(e) => handleChange(item.position, 'description', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
              placeholder="Description"
            />
          </div>

          <div className="col-span-4">
            <input
              type="date"
              value={item.duedate}
              onChange={(e) => handleChange(item.position, 'duedate', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
            />
          </div>

          <div className="col-span-2 flex justify-center">
            <input
              type="checkbox"
              checked={item.payment}
              onChange={(e) => handleChange(item.position, 'payment', e.target.checked)}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
            />
          </div>

        <div className="col-span-1 flex justify-center">
                <button
                onClick={() => removeItem(item.position)}
                className="text-red-500 hover:text-red-600 focus:outline-none"
                aria-label="Remove item"
                >
                <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
      ))}

      <div className="mt-3">
        <button
          onClick={addItem}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </button>
      </div>
    </div>
  );
}