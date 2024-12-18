import React from 'react';
// material-ui
import {
  Button,
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import {
  useAddServiceMutation,
  useDeleteProfilePhotoMutation,
  useDeleteServiceMutation,
  useEditProfileMutation,
  useFetchCitiesQuery,
  useFetchGendersQuery,
  useFetchServicesQuery,
  useFetchTypesQuery,
  usePostPhotosMutation,
  usePostProfileMutation,
} from 'store/reducers/api';
import { useAuth } from 'contexts/index';
import Pictures from './Pictures';
import Loader from 'components/Loader';
import Services from './Services';
import { useEditUserMutation } from 'store/reducers/users';

// assets

// ============================|| FIREBASE - REGISTER ||============================ //

const AnketaForm = ({ profile = null, photos: initialPhotos = [], ...others }) => {
  const { user } = useAuth();

  const [postProfile, { isLoading: isPosting }] = usePostProfileMutation();
  const [editProfile, { isLoading: isEditing }] = useEditProfileMutation();
  const [addService, { isLoading: isAdding }] = useAddServiceMutation();
  const [editUser] = useEditUserMutation();
  const [updateService, { isLoading: isUpdating }] = useAddServiceMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();
  const [postPhotos, { isLoading: isPostingPhotos }] = usePostPhotosMutation();
  const [deletePhoto, { isLoading: isDeletingPhoto }] = useDeleteProfilePhotoMutation();

  const { data: cities = [] } = useFetchCitiesQuery();
  const { data: genders = [] } = useFetchGendersQuery();
  const { data: types = [] } = useFetchTypesQuery();
  const { data: servicesData } = useFetchServicesQuery();

  const [photos, setPhotos] = React.useState(initialPhotos);

  React.useEffect(() => {
    if (initialPhotos.length > 0) setPhotos(initialPhotos);
  }, [initialPhotos]);

  if (
    isPosting ||
    isEditing ||
    isAdding ||
    isDeleting ||
    isPostingPhotos ||
    isDeletingPhoto ||
    isUpdating ||
    others?.isFetching
  ) {
    return <Loader />;
  }

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={{
          user_id: user?.user_id,
          name: '',
          phone: '',
          age: '',
          height: '',
          weight: '',
          breast_size: '',
          nationality: '',
          address: '',
          services: [],
          price: '',
          price_hour: '',
          price_two_hours: '',
          price_night: '',
          additional_info: '',
          ...profile,
          city: profile?.city?.id || '',
          gender: profile?.gender?.id || '',
          profile_type: profile?.profile_type?.id || '',
          photos: initialPhotos,
          submit: null,
        }}
        validationSchema={Yup.object().shape({
          services: Yup.array()
            .of(
              Yup.object().shape({
                price: Yup.number()
                  .typeError('Цена должна быть числом')
                  .required('Цена обязательна'),
              })
            )
            .min(1, 'Услуги обязательны')
            .required('Услуги обязательны'),
          name: Yup.string().max(255).required('Имя обязательно'),
          phone: Yup.string().max(255).required('Телефон обязателен'),
          telegram: Yup.string().max(255),
          whatsapp: Yup.string().max(255),
          profile_type: Yup.string().max(255).required('Тип обязателен'),
          gender: Yup.string().max(255).required('Пол обязателен'),
          age: Yup.number()
            .min(18, 'Минимальный возраст 18 лет')
            .max(255)
            .required('Возраст обязателен'),
          height: Yup.number()
            .min(20, 'Минимальный рост 20 см')
            .max(255)
            .required('Рост обязателен'),
          weight: Yup.number().min(0, 'Минимальный вес 0 кг').max(255).required('Вес обязателен'),
          breast_size: Yup.number()
            .min(0, 'Минимальный размер груди 0')
            .max(255)
            .required('Размер груди обязателен'),
          nationality: Yup.string().required('Национальность обязателен'),
          address: Yup.string().max(255).required('Адрес обязателен'),
          price: Yup.string().max(255).required('Цена обязательна'),
          city: Yup.number().required('Город обязателен'),
          additional_info: Yup.string().required('Дополнительная информация обязательна'),
          photos: Yup.array()
            .min(2, 'Минимальное количество фото 3')
            .max(15, 'Максимальное количество фото 15')
            .required('Фото обязательно'),
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            if (photos.filter((photo) => photo?.upload).length < 3) {
              setStatus({ success: false });
              setErrors({
                submit: 'Минимальное количество фото 3',
                photos: 'Минимальное количество фото 3',
              });
            } else {
              const profileData = {
                ...values,
                city_id: values.city,
                profile_type_id: values.profile_type,
                gender_id: values.gender,
                user_id: user?.user_id,
              };
              const services = values.services;
              delete profileData.services;
              delete profileData.photos;
              const addServices = async (profile_id) => {
                const allServices = profile?.services || [];
                const selectedServices = services || [];

                const forUpdate = selectedServices
                  .filter((item) =>
                    allServices.find(
                      (service) => service.id === item.id && service.price !== item.price
                    )
                  )
                  .map((item) => ({
                    service_id: item.id,
                    profile_id: profile_id,
                    price: item.price,
                  }));

                // Assuming services are objects with an `id` property
                const forAdd = selectedServices
                  .filter(
                    (item) =>
                      !allServices.find((service) => {
                        return service.id === item.id;
                      })
                  )
                  .map((item) => ({
                    service_id: item.id,
                    profile_id: profile_id,
                    price: item.price,
                  }));

                const forDelete = allServices
                  .filter((service) => !selectedServices.find((item) => item.id === service.id))
                  .map((service) => ({ service_id: service.id, profile_id: profile_id }));

                if (forUpdate.length > 0) {
                  const response = await updateService(forUpdate);
                  if (response?.error) {
                    setErrors({ submit: 'Что то пошло не так при обновлении услуг' });
                  }
                }

                if (forAdd.length > 0) {
                  const response = await addService(forAdd);
                  if (response?.error) {
                    setErrors({ submit: 'Что то пошло не так при добавлении услуг' });
                  }
                }
                if (forDelete.length > 0) {
                  const response = await deleteService(forDelete);
                  if (response?.error) {
                    setErrors({ submit: 'Что то пошло не так при удалении услуг' });
                  }
                }
              };

              const handlePostPhotos = async (profile_id) => {
                setPhotos((prev) => prev.map((photo) => photo.upload));
                const postFormData = new FormData();

                photos.forEach(async (photo) => {
                  if (photo.upload && typeof photo?.upload === 'object') {
                    postFormData.append('files', photo.upload);
                  } else if (!photo?.upload && photo?.id) {
                    await deletePhoto({ id: photo.id, profile_id: profile_id });
                  }
                });

                if (
                  photos.filter((photo) => typeof photo?.upload === 'object' && photo?.upload)
                    .length > 0
                ) {
                  const responsePhotos = await postPhotos({
                    data: postFormData,
                    profile_id: profile_id,
                  });

                  if (responsePhotos?.error) {
                    setErrors({ submit: 'Что то пошло не так при загрузке фото' });
                  } else {
                    setSubmitting(false);
                  }
                }
              };

              if (!profile) {
                const response = await postProfile({ ...profileData, user_id: user?.user_id });
                if (response?.error) {
                  setErrors({ submit: 'Что то пошло не так' });
                  setStatus({ success: false });
                } else {
                  await addServices(response.data.id);
                  await handlePostPhotos(response.data.id);
                  await editUser({
                    id: user?.user_id,
                    email: user?.email,
                    twitter_link: values?.telegram,
                    facebook_link: values?.whatsapp,
                  });
                }
              } else {
                const response = await editProfile(profileData);
                if (response.error) {
                  setErrors({ submit: 'Что то пошло не так' });
                } else {
                  await addServices(profile.id);
                  await handlePostPhotos(profile.id);
                  await editUser({
                    id: user?.user_id,
                    email: user?.email,
                    twitter_link: values?.telegram,
                    facebook_link: values?.whatsapp,
                  });
                }
              }
              setStatus({ success: false });
            }
          } catch (err) {
            console.error(err);
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          touched,
          values,
          setFieldValue,
        }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Stack
                  spacing={3}
                  direction="column"
                  height="100%"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Pictures photos={photos} setPhotos={setPhotos} setFieldValue={setFieldValue} />
                  {errors.photos && (
                    <FormHelperText error id="helper-text-photos-form" sx={{ mx: 'auto' }}>
                      {errors.photos}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={7}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Имя*</InputLabel>
                      <OutlinedInput
                        id="name-login"
                        type="name"
                        value={values.name || ''}
                        name="name"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Ваше имя"
                        fullWidth
                        error={Boolean(touched.name && errors.name)}
                      />
                      {touched.name && errors.name && (
                        <FormHelperText error id="helper-text-name-signup">
                          {errors.name}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Телефон*</InputLabel>
                      <OutlinedInput
                        id="phone-login"
                        type="phone"
                        value={values.phone || ''}
                        name="phone"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="+7 (999) 999-99-99"
                        fullWidth
                        error={Boolean(touched.phone && errors.phone)}
                      />
                      {touched.phone && errors.phone && (
                        <FormHelperText error id="helper-text-phone-signup">
                          {errors.phone}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-login">Телеграм</InputLabel>
                      <OutlinedInput
                        id="name-login"
                        type="text"
                        value={values.telegram || ''}
                        name="telegram"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="@username"
                        fullWidth
                        error={Boolean(touched.telegram && errors.telegram)}
                      />
                      {touched.telegram && errors.telegram && (
                        <FormHelperText error id="helper-text-telegram-signup">
                          {errors.telegram}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="whatsapp-login">Whatsapp</InputLabel>
                      <OutlinedInput
                        id="whatsapp-login"
                        type="phone"
                        value={values.whatsapp || ''}
                        name="whatsapp"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="+7 (999) 999-99-99"
                        fullWidth
                        error={Boolean(touched.whatsapp && errors.whatsapp)}
                      />
                      {touched.whatsapp && errors.whatsapp && (
                        <FormHelperText error id="helper-text-whatsapp-signup">
                          {errors.whatsapp}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel id="profile_type-label">Тип</InputLabel>
                      <Select
                        sx={{
                          '& .MuiList-root': { backgroundColor: 'background.default' },
                        }}
                        labelId="profile_type-label"
                        id="profile_type"
                        value={values.profile_type || ''}
                        label="Тип"
                        onChange={handleChange}
                        name="profile_type"
                        onBlur={handleBlur}
                      >
                        {types.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.profile_type && errors.profile_type && (
                        <FormHelperText error id="helper-text-type-signup">
                          {errors.profile_type}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel id="gender-label">Категория*</InputLabel>
                      <Select
                        sx={{
                          '& .MuiList-root': { backgroundColor: '#121212 !important' },
                        }}
                        labelId="gender-label"
                        id="gender"
                        value={values.gender || ''}
                        label="Категория"
                        name="gender"
                        onChange={handleChange}
                      >
                        {genders.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.gender && errors.gender && (
                        <FormHelperText error id="helper-text-gender-signup">
                          {errors.gender}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={5} md={3}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Рост*</InputLabel>
                      <OutlinedInput
                        id="height-login"
                        type="number"
                        value={values.height || ''}
                        name="height"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="170"
                        fullWidth
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 18 }}
                        error={Boolean(touched.height && errors.height)}
                      />
                      {touched.height && errors.height && (
                        <FormHelperText error id="helper-text-height-signup">
                          {errors.height}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Вес*</InputLabel>
                      <OutlinedInput
                        id="weight-login"
                        type="number"
                        value={values.weight || ''}
                        name="weight"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="45"
                        fullWidth
                        error={Boolean(touched.weight && errors.weight)}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 18 }}
                      />
                      {touched.weight && errors.weight && (
                        <FormHelperText error id="helper-text-weight-signup">
                          {errors.weight}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>{' '}
                  <Grid item xs={3}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Размер груди*</InputLabel>
                      <OutlinedInput
                        id="breast_size-login"
                        type="number"
                        value={values.breast_size || ''}
                        name="breast_size"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="2"
                        fullWidth
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
                        error={Boolean(touched.breast_size && errors.breast_size)}
                      />
                      {touched.breast_size && errors.breast_size && (
                        <FormHelperText error id="helper-text-breast_size-signup">
                          {errors.breast_size}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="name-signup">Возраст*</InputLabel>
                      <OutlinedInput
                        id="age-login"
                        type="number"
                        value={values.age || ''}
                        name="age"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="20"
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 18 }}
                        fullWidth
                        error={Boolean(touched.age && errors.age)}
                      />
                      {touched.age && errors.age && (
                        <FormHelperText error id="helper-text-age-signup">
                          {errors.age}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={8} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="nationality-form">Национальность*</InputLabel>
                      <OutlinedInput
                        id="nationality-form"
                        type="text"
                        value={values.nationality || ''}
                        name="nationality"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Марсианка"
                        fullWidth
                        error={Boolean(touched.nationality && errors.nationality)}
                      />
                      {touched.nationality && errors.nationality && (
                        <FormHelperText error id="helper-text-nationality-form">
                          {errors.nationality}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="city-form">Город*</InputLabel>
                      <Select
                        sx={{
                          '& .MuiList-root': { backgroundColor: '#121212 !important' },
                        }}
                        id="city-form"
                        value={values.city || ''}
                        name="city"
                        onBlur={handleBlur}
                        onChange={handleChange}
                      >
                        {cities?.map((city) => (
                          <MenuItem key={city.id} value={city.id}>
                            {city.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {touched.city && errors.city && (
                        <FormHelperText error id="helper-text-city-form">
                          {errors.city}
                        </FormHelperText>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={6} md={2}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="price-form">Цена от*</InputLabel>
                  <OutlinedInput
                    id="price-form"
                    type="number"
                    min="0"
                    value={values.price || ''}
                    name="price"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="3000+"
                    fullWidth
                    error={Boolean(touched.price && errors.price)}
                  />
                  {touched.price && errors.price && (
                    <FormHelperText error id="helper-text-price-form">
                      {errors.price}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={6} md={2}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="price_hour-form">Цена за час*</InputLabel>
                  <OutlinedInput
                    id="price_hour-form"
                    type="number"
                    min="0"
                    value={values.price_hour || ''}
                    name="price_hour"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="3000+"
                    fullWidth
                    error={Boolean(touched.price_hour && errors.price_hour)}
                  />
                  {touched.price_hour && errors.price_hour && (
                    <FormHelperText error id="helper-text-price_hour-form">
                      {errors.price_hour}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={6} md={2}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="price_two_hours-form">Цена за два часа*</InputLabel>
                  <OutlinedInput
                    id="price_two_hours-form"
                    type="number"
                    min="0"
                    value={values.price_two_hours || ''}
                    name="price_two_hours"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="3000+"
                    fullWidth
                    error={Boolean(touched.price_two_hours && errors.price_two_hours)}
                  />
                  {touched.price_two_hours && errors.price_two_hours && (
                    <FormHelperText error id="helper-text-price_two_hours-form">
                      {errors.price_two_hours}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={6} md={2}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="price_night-form">Цена за ночь*</InputLabel>
                  <OutlinedInput
                    id="price_night-form"
                    type="number"
                    min="0"
                    value={values.price_night || ''}
                    name="price_night"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="3000+"
                    fullWidth
                    error={Boolean(touched.price_night && errors.price_night)}
                  />
                  {touched.price_night && errors.price_night && (
                    <FormHelperText error id="helper-text-price_night-form">
                      {errors.price_night}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="address-form">Адрес*</InputLabel>
                  <OutlinedInput
                    id="address-form"
                    type="text"
                    value={values.address || ''}
                    name="address"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="г. Москва, ул. Пушкина, д. 23"
                    fullWidth
                    error={Boolean(touched.address && errors.address)}
                  />
                  {touched.address && errors.address && (
                    <FormHelperText error id="helper-text-address-form">
                      {errors.address}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel>Услуги*</InputLabel>
                  {values?.services?.length > 0 &&
                    values?.services?.map((service) => (
                      <Stack key={service?.id} direction="row" alignItems="center">
                        <TextField value={service?.name} disabled fullWidth />
                        <TextField
                          value={service?.price || ''}
                          onChange={(event) => {
                            const newServices = values.services.map((s) => {
                              if (s.id === service.id) {
                                return { ...s, price: event.target.value };
                              }
                              return s;
                            });
                            setFieldValue('services', newServices);
                          }}
                          name="price"
                          placeholder="Цена за услугу"
                          required
                          type="number"
                          error={Boolean(touched.services && errors.services)}
                          autoFocus={!service?.price}
                        />
                        <CloseIcon
                          sx={{ cursor: 'pointer', ml: 1 }}
                          onClick={() => {
                            const newServices = values.services.filter((s) => s.id !== service.id);
                            setFieldValue('services', newServices);
                          }}
                        />
                      </Stack>
                    ))}
                  <Services
                    value={values?.services}
                    values={servicesData || []}
                    setValues={(newServices) => setFieldValue('services', newServices)}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="decription-form">Обо мне*</InputLabel>
                  <TextField
                    id="decription-form"
                    type="text"
                    value={values.additional_info}
                    name="additional_info"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Напишите какой-нибудь текст"
                    fullWidth
                    multiline
                    rows={4}
                    error={Boolean(touched.additional_info && errors.additional_info)}
                  />
                  {touched.additional_info && errors.additional_info && (
                    <FormHelperText error id="helper-text-additional_info-form">
                      {errors.additional_info}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              {errors.submit && (
                <Grid item xs={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}
              <Grid item xs={12}>
                <AnimateButton>
                  <Button
                    disableElevation
                    disabled={isSubmitting || isPosting || isEditing}
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    {profile?.id ? 'Сохранить анкету' : 'Создать анкету'}
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
};

export default AnketaForm;
