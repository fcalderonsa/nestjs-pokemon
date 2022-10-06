import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { CreatePokemonDto } from '../../application/dto/create-pokemon.dto';
import { UpdatePokemonDto } from '../../application/dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from '../entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import { Cache } from 'cache-manager';

@Injectable()
export class PokemonService {
  private readonly log = new Logger();
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    @Inject(CACHE_MANAGER)
    private readonly cacheMannager: Cache,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleException(error);
    }
    this.log.debug(createPokemonDto);
  }

  async findAll() {
    await this.cacheMannager.set('cached_item', { key: 10 });
    const pokecache = await this.cacheMannager.get('cached_item');
    console.log(pokecache);
    return 'Hello there';
  }

  async findOne(term: string): Promise<Pokemon> {
    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }
    if (!pokemon) {
      throw new NotFoundException(`Pokemon not found`);
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = this.findOne(term);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      (await pokemon).updateOne(updatePokemonDto);
    } catch (error) {
      this.handleException(error);
    }
    return { ...(await pokemon).toJSON(), ...UpdatePokemonDto };
  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0) {
      throw new Error(`Pokemon with id '${id}' not found`);
    }
  }

  private handleException(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon already exists`);
    }
    throw new Error(`Can't create Pokemon - Check server logs`);
  }
}
