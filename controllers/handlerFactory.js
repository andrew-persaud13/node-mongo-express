const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIFeatures');

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    //for nested get reviews
    const query = req.params.tourId ? { tour: req.params.tourId } : {};
    const apiFeature = new APIFeatures(Model.find(query), req.query)
      .filter()
      .sort()
      .project()
      .paginate();

    const docs = await apiFeature.mongooseQuery;

    return res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });

exports.getOne = (Model, populateOptions = null) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const query = Model.findById(id);

    const doc = populateOptions
      ? await query.populate(populateOptions)
      : await query;

    if (!doc) {
      return next(new AppError('No document found with this id.', 404));
    }

    return res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndDelete(id);
    if (!doc) return next(new AppError('No document found with that id', 404));

    return res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) return next(new AppError('No document found with that id', 404));

    return res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    let doc = new Model(req.body);
    doc = await doc.save(); //can also just do const doc = await Model.create(req.body)

    return res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
