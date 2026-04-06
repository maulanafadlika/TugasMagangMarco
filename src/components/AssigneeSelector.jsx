import React from "react";
import Select from "react-select";

const LoadingOption = () => (
  <div className="flex items-center justify-center">
    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
  </div>
); 

const AssigneeSelector = ({ projectAssignees, formDataSub, handleAssigneeChange, isLoading, isEditingSub,dataPlace }) => { 
  const assigneeOptions = projectAssignees.map((assignee) => ({
    value: assignee.assignee_id,
    label: assignee.assignee_name,
  }));

  return (
      <div className="relative font-poppins w-full mb-4 mt-8">
        {isEditingSub && <label className="absolute top-[-20px] px-3 text-[12px] text-gray-600">Assignee</label> }
        <Select
          className="w-full"
          options={isLoading && assigneeOptions.length === 0 ? [{ value: '', label: <LoadingOption /> }] : assigneeOptions}
          value={assigneeOptions.find(option => option.value === formDataSub.assignee) || null}
          onChange={(selectedOption) => {
            handleAssigneeChange(selectedOption.value);
          }}
          isSearchable={true}
          placeholder="Assignee"
          menuPortalTarget={document.body}
          menuPosition="absolute"
          menuPlacement={dataPlace || 'top'}
          styles={{
            control: (base, state) => ({
              ...base,
              borderRadius: '7px',
              padding: '2px',
              fontSize: '14px',
              borderColor: state.isFocused ? 'black' : '#B0BEC5',
              boxShadow: state.isFocused ? '0 0 0 1px black' : base.boxShadow,
              '&:hover': {
                borderColor: state.isFocused ? 'black' : '#B0BEC5',
              },
            }),
            menu: (base) => ({
              ...base,
              borderRadius: '7px',
              padding: '12px 12px',
              position: 'absolute',
              zIndex: 9999,
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999,
            }),
            option: (base, state) => ({
              ...base,
              borderRadius: '7px',
              fontSize: '14px',
              padding: '8px 12px',
              backgroundColor: state.isSelected
                ? '#2196F3'
                : state.isFocused
                ? '#E9F5FE'
                : base.backgroundColor,
              color: state.isSelected ? '#fff' : '#616161',
              ':active': {
                ...base[':active'],
                backgroundColor: state.isSelected ? '#2196F3' : '#E9F5FE',
              },
              ...(state.data.value === '' && {
                backgroundColor: 'transparent',
                cursor: 'default',
                ':hover': {
                  backgroundColor: 'transparent',
                },
              }),
            }),
          }}
        />
      </div>
  );
};

export default AssigneeSelector;