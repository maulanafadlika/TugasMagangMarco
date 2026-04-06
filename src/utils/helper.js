import Cookies from 'js-cookie';
const { VITE_BASE_URL } = import.meta.env

export const formatDate = (dateString, fullDateTime = false, posibleNull = false, posibleNullMonth = false, dateMonthName = false) => {
  // Handle null/invalid dates
  if ((posibleNull || posibleNullMonth) && (!dateString || dateString === '0000-00-00' || dateString === '1970-01-01' || isNaN(new Date(dateString).getTime()))) {
    return null;
  }

  const date = new Date(dateString);

  if (posibleNullMonth) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  if (dateMonthName) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Oct', 'Nov', 'Des'];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }


  if (fullDateTime) {
    return date.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');
  }

  return date.toLocaleDateString('en-CA');
};


export const formatKanbanDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatFilenames = (filenames) => {
  return filenames.split(',').map(file => file.trim()).join(', ');
};

export const capitalizeWords = (text) =>
  typeof text === 'string'
    ? text.split(' ').map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    : text;

export const handleDownload = async (filename) => {
  const token = Cookies.get('TOKEN');

  if (!token) {
    console.error('No token found');
    return;
  }

  try {
    const response = await fetch(`${VITE_BASE_URL}/api/v1/download/file/${filename}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

export const handleTemplateDownload = async (filename) => {
  const token = Cookies.get('TOKEN');

  if (!token) {
    console.error('No token found');
    return;
  }

  try {
    const response = await fetch(`${VITE_BASE_URL}/api/v1/docs-standard/download/${filename}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

export const getInitial = (fullName) => {
  if (!fullName) return "";
  const firstName = fullName.split(" ")[0];
  return firstName.charAt(0).toUpperCase();
};

export const getInitialComment = (name) => {
  if (!name) return "";
  const initials = name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
  return initials;
};