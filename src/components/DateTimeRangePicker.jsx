import React, { useState, useEffect } from 'react';
import { 
  Input,
  Card,
  CardBody,
  Button,
  IconButton,
  Typography
} from "@material-tailwind/react";
import { 
  faCalendarDays, 
  faChevronLeft,
  faChevronRight,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DateRangePicker = ({ 
  showTime = false, 
  value = null,
  onChange = () => {},
  labelTitle
}) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (value) {
      if (value.startDate) {
        setStartDate(value.startDate);
        const date = new Date(value.startDate);
        setSelectedMonth(date.getMonth());
        setSelectedYear(date.getFullYear());
      }
      if (value.startTime) setStartTime(value.startTime);
      if (value.endDate) setEndDate(value.endDate);
      if (value.endTime) setEndTime(value.endTime);
    }
  }, [value]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatDisplayDate = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNamesShort[date.getMonth()];
    const year = date.getFullYear();
    
    if (showTime && timeStr) {
      return `${day} ${month} ${year}, ${timeStr}`;
    }
    return `${day} ${month} ${year}`;
  };

  const handleApply = () => {
    // Validasi: pastikan start dan end date terisi
    if (!startDate || !endDate) {
      setErrorMessage('Silakan pilih tanggal mulai dan tanggal selesai');
      return;
    }

    // Validasi: pastikan start date tidak lebih besar dari end date
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
      return;
    }

    // Reset error dan apply
    setErrorMessage('');
    const dateRangeValue = {
      startDate,
      startTime,
      endDate,
      endTime
    };
    onChange(dateRangeValue);
    setOpen(false);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    // Reset error saat user mulai pilih tanggal
    setErrorMessage('');
    
    const clickedDate = formatDate(new Date(selectedYear, selectedMonth, day));
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate('');
    } else if (startDate && !endDate) {
      if (new Date(clickedDate) >= new Date(startDate)) {
        setEndDate(clickedDate);
      } else {
        setEndDate(startDate);
        setStartDate(clickedDate);
      }
    }
  };

  const isDateInRange = (day) => {
    if (!startDate || !endDate) return false;
    const date = new Date(selectedYear, selectedMonth, day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  };

  const isDateSelected = (day) => {
    const date = formatDate(new Date(selectedYear, selectedMonth, day));
    return date === startDate || date === endDate;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    dayNames.forEach((name, idx) => {
      days.push(
        <div key={`header-${idx}`} className="text-center text-xs font-medium text-gray-600 py-2">
          {name}
        </div>
      );
    });

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isInRange = isDateInRange(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            p-2 text-sm rounded-lg transition-all
            ${isSelected ? 'bg-blue-500 text-white font-semibold' : ''}
            ${isInRange && !isSelected ? 'bg-blue-100 text-blue-700' : ''}
            ${!isSelected && !isInRange ? 'text-gray-700 hover:bg-gray-100' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayValue = () => {
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return formatDisplayDate(startDate, startTime);
    if (!startDate && endDate) return formatDisplayDate(endDate, endTime);
    
    return `${formatDisplayDate(startDate, startTime)}  →  ${formatDisplayDate(endDate, endTime)}`;
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Input
          value={formatDisplayValue()}
          onClick={() => setOpen(true)}
          readOnly
          className="cursor-pointer"
          icon={<FontAwesomeIcon icon={faCalendarDays} className="text-gray-500" />}
          label={labelTitle}
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <IconButton 
                  onClick={handlePrevMonth} 
                  size="sm"
                  variant="text"
                  className="text-gray-700"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </IconButton>
                
                <div className="flex items-center gap-2">
                  {/* Month Selector */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowMonthPicker(!showMonthPicker);
                        setShowYearPicker(false);
                      }}
                      className="px-4 py-2 rounded-lg hover:bg-gray-100 font-bold text-gray-800 transition-colors"
                    >
                      {monthNames[selectedMonth]}
                    </button>
                    
                    {showMonthPicker && (
                      <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 max-h-64 overflow-y-auto">
                        {monthNames.map((month, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedMonth(index);
                              setShowMonthPicker(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                              selectedMonth === index ? 'bg-blue-100 font-semibold text-blue-700' : ''
                            }`}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Year Selector */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowYearPicker(!showYearPicker);
                        setShowMonthPicker(false);
                      }}
                      className="px-4 py-2 rounded-lg hover:bg-gray-100 font-bold text-gray-800 transition-colors"
                    >
                      {selectedYear}
                    </button>
                    
                    {showYearPicker && (
                      <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32 max-h-64 overflow-y-auto">
                        {Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i).map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              setSelectedYear(year);
                              setShowYearPicker(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                              selectedYear === year ? 'bg-blue-100 font-semibold text-blue-700' : ''
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <IconButton 
                  onClick={handleNextMonth} 
                  size="sm"
                  variant="text"
                  className="text-gray-700"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </IconButton>
              </div>

              {/* Selected Dates Indicator */}
              <div className="mb-4 flex items-center justify-between gap-3 px-2">
                <div className="flex-1 text-center">
                  <Typography variant="small" className="text-gray-600 font-medium mb-1">
                    Tanggal Mulai
                  </Typography>
                  <Typography variant="small" className={`font-semibold ${startDate ? 'text-blue-600' : 'text-gray-400'}`}>
                    {startDate ? formatDisplayDate(startDate, '') : 'Pilih tanggal'}
                  </Typography>
                </div>
                
                <div className="text-gray-400 mt-5">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
                
                <div className="flex-1 text-center">
                  <Typography variant="small" className="text-gray-600 font-medium mb-1">
                    Tanggal Selesai
                  </Typography>
                  <Typography variant="small" className={`font-semibold ${endDate ? 'text-blue-600' : 'text-gray-400'}`}>
                    {endDate ? formatDisplayDate(endDate, '') : 'Pilih tanggal'}
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-6">
                {renderCalendar()}
              </div>

              {showTime && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Typography variant="small" className="font-medium text-gray-700 mb-2">
                      Waktu Mulai
                    </Typography>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="!border-gray-300"
                      labelProps={{
                        className: "hidden",
                      }}
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="font-medium text-gray-700 mb-2">
                      Waktu Selesai
                    </Typography>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="!border-gray-300"
                      labelProps={{
                        className: "hidden",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Typography variant="small" className="text-red-600 font-medium">
                    {errorMessage}
                  </Typography>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setStartTime('09:00');
                    setEndTime('17:00');
                    setErrorMessage('');
                    onChange({
                      startDate: '',
                      startTime: '09:00',
                      endDate: '',
                      endTime: '17:00'
                    });
                  }}
                  fullWidth
                  className="normal-case"
                >
                  Reset
                </Button>
                <Button
                  color="blue"
                  onClick={handleApply}
                  fullWidth
                  className="normal-case"
                >
                  Terapkan
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};


export default DateRangePicker;