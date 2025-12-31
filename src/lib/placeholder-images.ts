import data from './placeholder-images.json';

type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export { PlaceHolderImages, type ImagePlaceholder };
