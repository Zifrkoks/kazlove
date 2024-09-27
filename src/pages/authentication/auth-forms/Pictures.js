import React from 'react';
import PropTypes from 'prop-types';
import { Navigation, Pagination, A11y } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

// material-ui
import { Box, IconButton, Button } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import createPreview from 'utils/createPreview';

const MySwiper = ({ photos = [], setPhotos, ...props }) => {
  const inputRef = React.useRef(null);

  const handleDeletePhoto = (id) => {
    const updatedPhotos = photos.filter((photo) => photo.id !== id);
    const deletedPhoto = photos.find((photo) => photo.id === id);
    deletedPhoto.upload = null;

    setPhotos(() => [...updatedPhotos, deletedPhoto]);
    props.setFieldValue('photos', updatedPhotos);
  };

  return (
    <Box maxWidth={{ xs: '370px', sm: '700px' }} width="100%" mx="auto">
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
      >
        {photos.map((photo, i) => {
          if (!photo?.upload) return null;
          return (
            <SwiperSlide key={i} style={{ position: 'relative' }}>
              <IconButton
                onClick={() => handleDeletePhoto(photos[i].id)}
                sx={{ position: 'absolute', top: '2%', right: '2%' }}
              >
                <Delete size="large" />
              </IconButton>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: '250px',
                  maxWidth: { xs: '250px', sm: '300px' },
                  height: { xs: '350px', sm: '400px' },
                  mx: 'auto',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={createPreview(photo.upload)}
                  alt="img"
                  loading="lazy"
                  style={{ width: 'auto', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </SwiperSlide>
          );
        })}

        <SwiperSlide>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: '250px',
              maxWidth: { xs: '250px', sm: '300px' },
              height: { xs: '350px', sm: '400px' },
              mx: 'auto',
              overflow: 'hidden',
              backgroundColor: 'secondary.light',
              opacity: 0.7,
            }}
          >
            <Button
              sx={{
                backgroundColor: 'white',
                opacity: 1,
                borderRadius: '50px',
                border: '1px solid',
                borderColor: 'white',
                color: 'secondary.main',
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'white',
                },
              }}
              variant="contained"
              startIcon={<Add />}
              onClick={() => inputRef.current.click()}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  setPhotos((prev) => [
                    ...prev,
                    ...Array.from(e.target.files).map((file) => ({
                      upload: file,
                      id: file.lastModified,
                    })),
                  ]);
                  props.setFieldValue('photos', photos);
                }}
                ref={inputRef}
              />
              Добавить фото
            </Button>
          </Box>
        </SwiperSlide>
      </Swiper>
    </Box>
  );
};

MySwiper.propTypes = {
  photos: PropTypes.array,
  setPhotos: PropTypes.func,
  description: PropTypes.bool,
  errors: PropTypes.object,
  setErrors: PropTypes.func,
  reorder: PropTypes.bool,
};

export default MySwiper;
