import { BaseEntity, BeforeInsert, BeforeRemove, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FULL_SERVER_ROOT, SAVED_DATA_PATH } from "../Modules/Constants";
import { Rating } from "./Rating";
import { existsSync, mkdirSync, rmSync } from "fs";
import { v4 } from "uuid";
import { User } from "./User";
import { join } from "path";

export enum SongStatus {
    BROKEN = -100,
    DEFAULT = 0,
    PROCESSING = 100,
    PUBLIC = 200,
    AWAITING_REVIEW = 300,
    ACCEPTED = 400,
    DENIED = 500,
}

@Entity()
export class Song extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    ID: string;

    @Column("uuid", { nullable: true })
    PID?: string;

    @ManyToOne(() => User, U => U.CreatedTracks)
    Author: User;

    @Column()
    Name: string;

    @Column()
    Year: number;

    @Column()
    ArtistName: string;

    @Column()
    Length: number;

    @Column()
    Scale: "Minor" | "Major";

    @Column()
    Key: string;

    @Column()
    Album: string;

    @Column({ default: "Guitar" })
    GuitarStarterType: "Keytar" | "Guitar";

    @Column()
    Tempo: number;

    @Column()
    Directory: string;

    @Column({ nullable: true })
    Midi?: string;

    @Column({ nullable: true })
    Cover?: string;

    @Column()
    BassDifficulty: number;

    @Column()
    GuitarDifficulty: number;

    @Column()
    DrumsDifficulty: number;

    @Column()
    VocalsDifficulty: number;

    @Column()
    IsDraft: boolean;

    @Column({ default: false })
    IsPublicDraft: boolean;

    @Column({ default: false })
    HasMidi: boolean;

    @Column({ default: false })
    HasCover: boolean;

    @Column({ default: false })
    HasAudio: boolean;

    @Column({ nullable: true })
    DraftReviewSubmittedAt?: Date;

    @Column({ default: SongStatus.DEFAULT })
    Status: SongStatus;

    @Column()
    CreationDate: Date;

    @Column({ nullable: true })
    Lipsync?: string;

    @OneToMany(() => Rating, R => R.Rated)
    Ratings: Rating[];

    @BeforeInsert()
    Setup() {
        this.ID = v4();

        if (this.PID === undefined) // im lazy but this will work regardless
            this.PID = this.ID; // By default they should be the same to save space, if we *need* a preview stream later we can change this when processing audio

        this.Directory = `${SAVED_DATA_PATH}/Songs/${this.ID}`;
        if (!existsSync(join(this.Directory, "Chunks")))
            mkdirSync(join(this.Directory, "Chunks"), { recursive: true });

        this.CreationDate = new Date();
    }

    @BeforeRemove()
    Delete() {
        if (existsSync(this.Directory) && this.Directory.endsWith(this.ID))
            rmSync(this.Directory, { recursive: true, force: true }); // lets hope this does not cause steam launcher for linux 2.0
    }

    public Package(IncludeStatus: boolean = false) {
        return {
            ...this,
            Status: IncludeStatus ? this.Status : SongStatus.DEFAULT,
            Author: this.Author ? this.Author.Package() : undefined,
            Directory: undefined, // we should NOT reveal that
            Midi: this.Midi ?? `${FULL_SERVER_ROOT}/song/download/${this.ID}/midi.mid`,
            Cover: this.Cover ?? `${FULL_SERVER_ROOT}/song/download/${this.ID}/cover.png`
        }
    }
}