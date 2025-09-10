'use client';

import { Tab, Tabs } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabStyles = {
  flexGrow: 1,
  borderRadius: '8px 8px 0px 0px',
  fontSize: '1rem',
  '&.Mui-selected': {
    backgroundColor: 'yomogi.800',
    color: 'gray.100',
  },
};

export default function HeaderTabs() {
  const pathname = usePathname();

  return (
    <Tabs
      value={pathname}
      variant="fullWidth"
      slotProps={{ indicator: { sx: { display: 'none' } } }}
      sx={{
        minHeight: 'auto',
        color: 'kinako.800',
      }}
    >
      <Tab label="地図" value="/" component={Link} href="/" disableRipple sx={tabStyles} />
      <Tab label="一覧" value="/list" component={Link} href="/list" disableRipple sx={tabStyles} />
    </Tabs>
  );
}
